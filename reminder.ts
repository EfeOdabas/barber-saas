import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import twilio from "twilio";

const prisma = new PrismaClient();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

function formatDate(date: Date) {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
}

async function notifyWaitlistForFreedAppointment(appointment: {
  barberId: string;
  serviceId: string;
  startAt: Date;
  barber: { name: string };
  service: { name: string };
}) {
  const date = appointment.startAt.toISOString().split("T")[0];

  const waitlist = await prisma.waitlistEntry.findMany({
    where: {
      barberId: appointment.barberId,
      serviceId: appointment.serviceId,
      date,
      notified: false,
    },
    include: {
      customer: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (waitlist.length === 0) {
    console.log("KEINE PASSENDE WARTELISTE");
    return;
  }

  const first = waitlist[0];

  if (!first.customer.phone) {
    console.log("WARTELISTE OHNE TELEFON");
    return;
  }

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: `whatsapp:${first.customer.phone}`,
    body: `💈 Termin frei geworden

Hallo ${first.customer.firstName},

es ist ein Termin frei geworden:

👤 ${appointment.barber.name}
✂️ ${appointment.service.name}
📅 ${formatDate(appointment.startAt)}
⏰ ${formatTime(appointment.startAt)}

Wenn du ihn willst, melde dich schnell.`,
  });

  await prisma.waitlistEntry.update({
    where: { id: first.id },
    data: {
      notified: true,
    },
  });

  console.log("WARTELISTE BENACHRICHTIGT");
}

async function run() {
  console.log("REMINDER START");

  const now = new Date();

  const appointments = await prisma.appointment.findMany({
    include: {
      barber: true,
      customer: true,
      service: true,
    },
  });

  for (const a of appointments) {
    const phone = a.customer?.phone;
    const firstName = a.customer?.firstName || "Kunde";
    const start = new Date(a.startAt);

    const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60);

    try {
      // 1) NICHT BESTÄTIGT + nur noch 24h bis Termin = automatisch löschen
      if (!a.confirmed && diffHours > 23.5 && diffHours < 24.5) {
        if (phone) {
          await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_FROM!,
            to: `whatsapp:${phone}`,
            body: `Dein Termin am ${formatDate(start)} um ${formatTime(
              start
            )} bei ${a.barber.name} wurde automatisch storniert, weil er nicht innerhalb von 24 Stunden bestätigt wurde.`,
          });
        }

        await prisma.appointment.delete({
          where: { id: a.id },
        });

        console.log("NICHT BESTÄTIGTER TERMIN GELÖSCHT:", a.id);

        await notifyWaitlistForFreedAppointment({
          barberId: a.barberId,
          serviceId: a.serviceId,
          startAt: start,
          barber: { name: a.barber.name },
          service: { name: a.service.name },
        });

        continue;
      }

      // 2) Bestätigte Termine bekommen 2h vorher normale Erinnerung
      if (a.confirmed && diffHours > 1.5 && diffHours < 2.5 && phone) {
        await client.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM!,
          to: `whatsapp:${phone}`,
          body: `Hi ${firstName}, kurze Erinnerung: Dein Termin ist in 2 Stunden um ${formatTime(
            start
          )} bei ${a.barber.name}. Wir freuen uns auf dich.`,
        });

        console.log("2H REMINDER GESENDET:", phone);
      }
    } catch (err) {
      console.log("REMINDER FEHLER:", a.id, err);
    }
  }

  console.log("REMINDER DONE");
}

run();
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const { prisma } = require("./src/lib/prisma");
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const from = process.env.TWILIO_WHATSAPP_FROM;

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

async function run() {
  console.log("SCHEDULER GESTARTET");

  const salon = await prisma.salon.findFirst();
  const confirmationHours = salon?.confirmationHours ?? 24;
  const reminderHours = salon?.reminderHours ?? 2;

  const now = new Date();

  const appointments = await prisma.appointment.findMany({
    where: {
      startAt: {
        gt: now,
      },
    },
    include: {
      customer: true,
      barber: true,
      service: true,
    },
    orderBy: {
      startAt: "asc",
    },
  });

  console.log("REMINDER CHECK:", appointments.length);

  for (const appointment of appointments) {
    const hoursUntil =
      (new Date(appointment.startAt).getTime() - now.getTime()) /
      (1000 * 60 * 60);

    if (
      !appointment.confirmed &&
      hoursUntil <= confirmationHours
    ) {
      await prisma.appointment.delete({
        where: { id: appointment.id },
      });

      console.log("NICHT BESTÄTIGTER TERMIN GELÖSCHT:", appointment.id);

      const waitlistEntry = await prisma.waitlistEntry.findFirst({
        where: {
          date: appointment.startAt.toISOString().split("T")[0],
          serviceId: appointment.serviceId,
          status: "waiting",
          OR: [
            { anyBarber: true },
            { barberId: appointment.barberId },
          ],
        },
        include: {
          customer: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (waitlistEntry && waitlistEntry.customer.phone) {
        const message = `💈 Termin frei geworden

Hi ${waitlistEntry.customer.firstName},

gute Nachrichten 🎉
Ein passender Termin ist frei geworden:

👤 Friseur: ${appointment.barber.name}
✂️ Service: ${appointment.service.name}
📅 Datum: ${formatDate(appointment.startAt)}
⏰ Uhrzeit: ${formatTime(appointment.startAt)}

Schreibe:
JA = Termin sichern
NEIN = überspringen

⏳ Du hast 15 Minuten Zeit.`;

        await prisma.waitlistEntry.update({
          where: { id: waitlistEntry.id },
          data: {
            status: "offered",
            notified: true,
            offerSentAt: now,
            offerExpiresAt: new Date(now.getTime() + 15 * 60 * 1000),
            notifiedAt: now,
            expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
            offeredBarberId: appointment.barberId,
            offeredStartAt: appointment.startAt,
            offeredEndAt: appointment.endAt,
          },
        });

        await client.messages.create({
          from,
          to: `whatsapp:${waitlistEntry.customer.phone}`,
          body: message,
        });

        console.log("WAITLIST ANGEBOT GESENDET:", waitlistEntry.customer.phone);
      }

      continue;
    }

    if (
      appointment.confirmed &&
      appointment.customer.phone &&
      hoursUntil <= reminderHours &&
      hoursUntil > reminderHours - 0.25
    ) {
      await client.messages.create({
        from,
        to: `whatsapp:${appointment.customer.phone}`,
        body: `⏰ Erinnerung an deinen Termin

Hi ${appointment.customer.firstName},

dein Termin startet bald:

👤 Friseur: ${appointment.barber.name}
✂️ Service: ${appointment.service.name}
📅 Datum: ${formatDate(appointment.startAt)}
⏰ Uhrzeit: ${formatTime(appointment.startAt)}

Wir freuen uns auf dich 💈`,
      });

      console.log("REMINDER GESENDET:", appointment.customer.phone);
    }
  }

  console.log("SCHEDULER FERTIG");
}

setInterval(() => {
  run().catch((error: unknown) => {
    console.error("SCHEDULER ERROR:", error);
  });
}, 60 * 1000);

run().catch((error: unknown) => {
  console.error("SCHEDULER ERROR:", error);
});
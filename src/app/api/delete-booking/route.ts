import { prisma } from "../../../lib/prisma";
import twilio from "twilio";

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

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const id = String(formData.get("id"));
    const redirectTo = String(formData.get("redirectTo") || "/admin");
    const redirectDate = String(formData.get("redirectDate") || "");

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        service: true,
        barber: true,
      },
    });

    if (!appointment) {
      return new Response("Termin nicht gefunden", { status: 404 });
    }

    const date = appointment.startAt.toISOString().split("T")[0];

    await prisma.appointment.delete({
      where: { id },
    });

    const waitlistEntry = await prisma.waitlistEntry.findFirst({
      where: {
        date,
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

    if (waitlistEntry) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_WHATSAPP_FROM;

      const now = new Date();
      const expires = new Date(now.getTime() + 15 * 60 * 1000);

      await prisma.waitlistEntry.update({
        where: { id: waitlistEntry.id },
        data: {
          status: "offered",
          notified: true,
          offerSentAt: now,
          offerExpiresAt: expires,
          notifiedAt: now,
          expiresAt: expires,
          offeredBarberId: appointment.barberId,
          offeredStartAt: appointment.startAt,
          offeredEndAt: appointment.endAt,
        },
      });

      if (accountSid && authToken && from && waitlistEntry.customer.phone) {
        const client = twilio(accountSid, authToken);

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

        await client.messages.create({
          from,
          to: `whatsapp:${waitlistEntry.customer.phone}`,
          body: message,
        });
      }
    }

    const target =
      redirectTo === "/admin/calendar" && redirectDate
        ? `/admin/calendar?date=${redirectDate}`
        : redirectTo || "/admin";

    return Response.redirect(new URL(target, req.url));
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return new Response("Fehler beim Löschen", { status: 500 });
  }
}
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
    const appointmentId = String(formData.get("appointmentId"));
    const action = String(formData.get("action"));

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        barber: true,
        service: true,
        customer: true,
      },
    });

    if (!appointment) {
      return new Response("Termin nicht gefunden", { status: 404 });
    }

    if (action === "confirm") {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { confirmed: true },
      });

      return Response.redirect(new URL("/admin", req.url));
    }

    if (action === "resend") {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_WHATSAPP_FROM;

      if (accountSid && authToken && from && appointment.customer.phone) {
        const client = twilio(accountSid, authToken);

        await client.messages.create({
          from,
          to: `whatsapp:${appointment.customer.phone}`,
          body: `Hi ${appointment.customer.firstName}, bitte bestätige deinen Termin:

👤 Friseur: ${appointment.barber.name}
✂️ Service: ${appointment.service.name}
📅 ${formatDate(appointment.startAt)}
⏰ ${formatTime(appointment.startAt)}

ANTWORTE MIT:
JA = bestätigen
NEIN = absagen`,
        });
      }

      return Response.redirect(new URL("/admin", req.url));
    }

    return new Response("Ungültige Aktion", { status: 400 });
  } catch (error) {
    console.error("APPOINTMENT ACTION ERROR:", error);
    return new Response("Fehler", { status: 500 });
  }
}
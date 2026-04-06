import { prisma } from "../../../lib/prisma";
import twilio from "twilio";

function toDate(date: string, time: string) {
  const d = new Date(`${date}T00:00:00.000Z`);
  const [h, m] = time.split(":").map(Number);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const barberId = String(formData.get("barberId"));
    const serviceId = String(formData.get("serviceId"));
    const date = String(formData.get("date"));
    const start = String(formData.get("start"));
    const end = String(formData.get("end"));

    const firstName = String(formData.get("firstName"));
    const lastName = String(formData.get("lastName"));
    const phone = String(formData.get("phone"));

    const startAt = toDate(date, start);
    const endAt = toDate(date, end);

    // ❗ Doppelbuchung verhindern
    const existing = await prisma.appointment.findFirst({
      where: {
        barberId,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });

    if (existing) {
      return new Response("Termin schon vergeben", { status: 400 });
    }

    // Kunde erstellen oder holen
    let customer = await prisma.customer.findFirst({
      where: { phone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          firstName,
          lastName,
          phone,
        },
      });
    }

    // Termin erstellen
    const appointment = await prisma.appointment.create({
      data: {
        barberId,
        serviceId,
        customerId: customer.id,
        startAt,
        endAt,
        confirmed: false,
      },
      include: {
        barber: true,
        service: true,
      },
    });

    // WhatsApp (FEHLER DARF NICHT CRASHEN)
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_WHATSAPP_FROM;

      if (accountSid && authToken && from && phone) {
        const client = twilio(accountSid, authToken);

        const body = `Hi ${firstName},

dein Termin wurde angefragt:

👤 Friseur: ${appointment.barber.name}
✂️ Service: ${appointment.service.name}
📅 Datum: ${date}
⏰ Uhrzeit: ${start}

ANTWORTE:
JA = bestätigen
NEIN = absagen`;

        await client.messages.create({
          from,
          to: `whatsapp:${phone}`,
          body,
        });
      }
    } catch (err) {
      console.error("WHATSAPP ERROR:", err);
      // ❗ KEIN ABSTURZ
    }

    return Response.redirect(new URL("/book", req.url));
  } catch (error) {
    console.error("BOOK ERROR:", error);
    return new Response("Serverfehler beim Buchen", { status: 500 });
  }
}
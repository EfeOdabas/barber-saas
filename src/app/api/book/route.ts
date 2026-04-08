import { prisma } from "../../../lib/prisma";
import twilio from "twilio";

function toDate(date: string, time: string) {
  const d = new Date(`${date}T00:00:00.000Z`);
  const [h, m] = time.split(":").map(Number);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

function formatPhone(phone: string) {
  const cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");

  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith("0")) return `+49${cleaned.slice(1)}`;
  return `+49${cleaned}`;
}

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

    const barberId = String(formData.get("barberId") || "");
    const serviceId = String(formData.get("serviceId") || "");
    const date = String(formData.get("date") || "");
    const start = String(formData.get("start") || "");
    const end = String(formData.get("end") || "");
    const firstName = String(formData.get("firstName") || "");
    const lastName = String(formData.get("lastName") || "");
    const rawPhone = String(formData.get("phone") || "");

    if (
      !barberId ||
      !serviceId ||
      !date ||
      !start ||
      !end ||
      !firstName ||
      !lastName ||
      !rawPhone
    ) {
      return new Response("Fehlende Daten", { status: 400 });
    }

    const phone = formatPhone(rawPhone);
    const startAt = toDate(date, start);
    const endAt = toDate(date, end);

    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
    });

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!barber || !service) {
      return new Response("Friseur oder Service nicht gefunden", { status: 404 });
    }

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

    const salon = await prisma.salon.findFirst();
    const confirmationHours = salon?.confirmationHours ?? 24;
    const hoursUntilAppointment =
      (startAt.getTime() - Date.now()) / (1000 * 60 * 60);
    const autoConfirmed = hoursUntilAppointment <= confirmationHours;

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

    await prisma.appointment.create({
      data: {
        barberId,
        serviceId,
        customerId: customer.id,
        startAt,
        endAt,
        confirmed: autoConfirmed,
      },
    });

    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_WHATSAPP_FROM;

      if (accountSid && authToken && from) {
        const client = twilio(accountSid, authToken);

        const body = autoConfirmed
          ? `Hi ${firstName},

dein Termin ist gebucht und direkt bestätigt ✅

👤 Friseur: ${barber.name}
✂️ Service: ${service.name}
📅 Datum: ${formatDate(startAt)}
⏰ Uhrzeit: ${formatTime(startAt)}

Wenn du den Termin absagen möchtest, schreibe:
ABSAGEN`
          : `Hi ${firstName},

dein Termin wurde angefragt:

👤 Friseur: ${barber.name}
✂️ Service: ${service.name}
📅 Datum: ${formatDate(startAt)}
⏰ Uhrzeit: ${formatTime(startAt)}

Bitte antworte mit:
JA = bestätigen
ABSAGEN = absagen

Wichtig:
Spätestens ${confirmationHours} Stunden vor dem Termin muss bestätigt sein.`;

        await client.messages.create({
          from,
          to: `whatsapp:${phone}`,
          body,
        });
      }
    } catch (twilioError) {
      console.error("WHATSAPP ERROR:", twilioError);
    }

    return Response.redirect(new URL("/book?success=1", req.url));
  } catch (error) {
    console.error("BOOK ERROR:", error);
    return new Response("Serverfehler beim Buchen", { status: 500 });
  }
}
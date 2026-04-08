import { prisma } from "../../../../lib/prisma";
import twilio from "twilio";

function xml(message = "ok") {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
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

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function slotMatchesWindow(
  slotStart: Date,
  preferredFromTime?: string | null,
  preferredToTime?: string | null
) {
  const slotMinutes =
    slotStart.getUTCHours() * 60 + slotStart.getUTCMinutes();

  if (preferredFromTime && slotMinutes < toMinutes(preferredFromTime)) {
    return false;
  }

  if (preferredToTime && slotMinutes > toMinutes(preferredToTime)) {
    return false;
  }

  return true;
}

function isCancelMessage(body: string) {
  return [
    "absagen",
    "absage",
    "storno",
    "stornieren",
    "cancel",
    "termin absagen",
  ].includes(body);
}

async function offerNextWaitlistPerson(params: {
  barberId: string;
  serviceId: string;
  date: string;
  startAt: Date;
  endAt: Date;
  barberName: string;
  serviceName: string;
  excludeWaitlistId?: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) return;

  const client = twilio(accountSid, authToken);

  const candidates = await prisma.waitlistEntry.findMany({
    where: {
      serviceId: params.serviceId,
      date: params.date,
      status: "waiting",
      id: params.excludeWaitlistId ? { not: params.excludeWaitlistId } : undefined,
      OR: [{ anyBarber: true }, { barberId: params.barberId }],
    },
    include: {
      customer: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const nextEntry = candidates.find((entry) =>
    slotMatchesWindow(
      params.startAt,
      entry.preferredFromTime,
      entry.preferredToTime
    )
  );

  if (!nextEntry || !nextEntry.customer.phone) return;

  const now = new Date();
  const expires = new Date(now.getTime() + 15 * 60 * 1000);

  await prisma.waitlistEntry.update({
    where: { id: nextEntry.id },
    data: {
      status: "offered",
      notified: true,
      offerSentAt: now,
      offerExpiresAt: expires,
      notifiedAt: now,
      expiresAt: expires,
      offeredBarberId: params.barberId,
      offeredStartAt: params.startAt,
      offeredEndAt: params.endAt,
    },
  });

  const message = `💈 Termin frei geworden

Hi ${nextEntry.customer.firstName},

gute Nachrichten 🎉
Ein passender Termin ist frei geworden:

👤 Friseur: ${params.barberName}
✂️ Service: ${params.serviceName}
📅 Datum: ${formatDate(params.startAt)}
⏰ Uhrzeit: ${formatTime(params.startAt)}

Schreibe:
JA = Termin sichern
ABSAGEN = Angebot ablehnen

⏳ Du hast 15 Minuten Zeit.`;

  await client.messages.create({
    from,
    to: `whatsapp:${nextEntry.customer.phone}`,
    body: message,
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const body = String(formData.get("Body") || "").trim().toLowerCase();
    const from = String(formData.get("From") || "").replace("whatsapp:", "");

    const customer = await prisma.customer.findFirst({
      where: { phone: from },
      orderBy: { id: "desc" },
    });

    if (!customer) return xml("Kein Kunde gefunden.");

    // 1) Aktives Wartelisten-Angebot zuerst prüfen
    const entry = await prisma.waitlistEntry.findFirst({
      where: {
        customerId: customer.id,
        status: "offered",
        offerExpiresAt: { gt: new Date() },
        offeredBarberId: { not: null },
        offeredStartAt: { not: null },
        offeredEndAt: { not: null },
      },
      include: {
        service: true,
        barber: true,
      },
      orderBy: { offerSentAt: "desc" },
    });

    if (entry) {
      if (body === "ja") {
        const existing = await prisma.appointment.findFirst({
          where: {
            barberId: entry.offeredBarberId!,
            startAt: entry.offeredStartAt!,
            endAt: entry.offeredEndAt!,
          },
        });

        if (existing) {
          await prisma.waitlistEntry.update({
            where: { id: entry.id },
            data: { status: "expired" },
          });

          return xml("Der Termin ist leider nicht mehr verfügbar.");
        }

        await prisma.appointment.create({
          data: {
            barberId: entry.offeredBarberId!,
            serviceId: entry.serviceId,
            customerId: entry.customerId,
            startAt: entry.offeredStartAt!,
            endAt: entry.offeredEndAt!,
            confirmed: true,
          },
        });

        await prisma.waitlistEntry.update({
          where: { id: entry.id },
          data: {
            status: "accepted",
            acceptedAt: new Date(),
          },
        });

        return xml(`Perfekt, dein Termin wurde für dich gebucht ✅

Wenn du den Termin doch absagen möchtest, schreibe:
ABSAGEN`);
      }

      if (isCancelMessage(body)) {
        await prisma.waitlistEntry.update({
          where: { id: entry.id },
          data: {
            status: "declined",
          },
        });

        await offerNextWaitlistPerson({
          barberId: entry.offeredBarberId!,
          serviceId: entry.serviceId,
          date: entry.date,
          startAt: entry.offeredStartAt!,
          endAt: entry.offeredEndAt!,
          barberName: entry.anyBarber
            ? "Verfügbarer Friseur"
            : entry.barber?.name || "Verfügbarer Friseur",
          serviceName: entry.service.name,
          excludeWaitlistId: entry.id,
        });

        return xml("Okay, das Angebot wurde abgelehnt.");
      }

      return xml("Bitte antworte nur mit JA oder ABSAGEN.");
    }

    // 2) Normalen zukünftigen Termin suchen
    const appointment = await prisma.appointment.findFirst({
      where: {
        customerId: customer.id,
        startAt: { gt: new Date() },
      },
      include: {
        barber: true,
        service: true,
      },
      orderBy: { startAt: "asc" },
    });

    if (!appointment) {
      return xml("Kein aktiver Termin gefunden.");
    }

    if (body === "ja") {
      if (appointment.confirmed) {
        return xml(`Dein Termin ist bereits bestätigt ✅

👤 Friseur: ${appointment.barber.name}
✂️ Service: ${appointment.service.name}
📅 Datum: ${formatDate(appointment.startAt)}
⏰ Uhrzeit: ${formatTime(appointment.startAt)}

Wenn du den Termin absagen möchtest, schreibe:
ABSAGEN`);
      }

      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { confirmed: true },
      });

      return xml(`Perfekt, dein Termin ist jetzt bestätigt ✅

👤 Friseur: ${appointment.barber.name}
✂️ Service: ${appointment.service.name}
📅 Datum: ${formatDate(appointment.startAt)}
⏰ Uhrzeit: ${formatTime(appointment.startAt)}

Wenn du den Termin absagen möchtest, schreibe:
ABSAGEN`);
    }

    if (isCancelMessage(body)) {
      const date = appointment.startAt.toISOString().split("T")[0];
      const barberName = appointment.barber.name;
      const serviceName = appointment.service.name;

      await prisma.appointment.delete({
        where: { id: appointment.id },
      });

      await offerNextWaitlistPerson({
        barberId: appointment.barberId,
        serviceId: appointment.serviceId,
        date,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        barberName,
        serviceName,
      });

      return xml("Okay, dein Termin wurde abgesagt.");
    }

    return xml("Bitte antworte nur mit JA oder ABSAGEN.");
  } catch (error) {
    console.error("TWILIO INCOMING ERROR:", error);
    return xml("Fehler.");
  }
}
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

async function offerNextWaitlistPerson(slot: {
  barberId: string;
  serviceId: string;
  date: string;
  startAt: Date;
  endAt: Date;
  barberName: string;
  serviceName: string;
  excludeWaitlistId?: string;
}) {
  const candidates = await prisma.waitlistEntry.findMany({
    where: {
      serviceId: slot.serviceId,
      date: slot.date,
      status: "waiting",
      id: slot.excludeWaitlistId ? { not: slot.excludeWaitlistId } : undefined,
      OR: [{ anyBarber: true }, { barberId: slot.barberId }],
    },
    include: {
      customer: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const entry = candidates.find((candidate: any) =>
    slotMatchesWindow(
      slot.startAt,
      candidate.preferredFromTime,
      candidate.preferredToTime
    )
  );

  if (!entry || !entry.customer.phone) return;

  const now = new Date();
  const expires = new Date(now.getTime() + 15 * 60 * 1000);

  await prisma.waitlistEntry.update({
    where: { id: entry.id },
    data: {
      status: "offered",
      notified: true,
      offerSentAt: now,
      offerExpiresAt: expires,
      notifiedAt: now,
      expiresAt: expires,
      offeredBarberId: slot.barberId,
      offeredStartAt: slot.startAt,
      offeredEndAt: slot.endAt,
    },
  });

  const message = `💈 Termin frei geworden

Hi ${entry.customer.firstName},

gute Nachrichten 🎉
Ein passender Termin ist frei geworden:

👤 Friseur: ${slot.barberName}
✂️ Service: ${slot.serviceName}
📅 Datum: ${formatDate(slot.startAt)}
⏰ Uhrzeit: ${formatTime(slot.startAt)}

Schreibe:
JA = Termin sichern
NEIN = überspringen

⏳ Du hast 15 Minuten Zeit.`;

  await client.messages.create({
    from,
    to: `whatsapp:${entry.customer.phone}`,
    body: message,
  });

  console.log("NEXT WAITLIST OFFER SENT TO:", entry.customer.phone);
}

async function run() {
  console.log("WAITLIST RUNNER START");

  const now = new Date();

  const expiredOffers = await prisma.waitlistEntry.findMany({
    where: {
      status: "offered",
      offerExpiresAt: { lt: now },
      offeredBarberId: { not: null },
      offeredStartAt: { not: null },
      offeredEndAt: { not: null },
    },
    include: {
      service: true,
      barber: true,
    },
    orderBy: {
      offerExpiresAt: "asc",
    },
  });

  for (const entry of expiredOffers) {
    await prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: { status: "expired" },
    });

    await offerNextWaitlistPerson({
      barberId: entry.offeredBarberId!,
      serviceId: entry.serviceId,
      date: entry.date,
      startAt: entry.offeredStartAt!,
      endAt: entry.offeredEndAt!,
      barberName: entry.anyBarber ? "Verfügbarer Friseur" : entry.barber?.name || "Verfügbarer Friseur",
      serviceName: entry.service.name,
      excludeWaitlistId: entry.id,
    });
  }

  console.log("WAITLIST RUNNER DONE");
}

run().catch((error: unknown) => {
  console.error("WAITLIST RUNNER ERROR:", error);
});
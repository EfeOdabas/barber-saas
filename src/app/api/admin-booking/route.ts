import { prisma } from "../../../lib/prisma";

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
    const startTime = String(formData.get("startTime"));

    const firstName = String(formData.get("firstName"));
    const lastName = String(formData.get("lastName"));
    const phone = String(formData.get("phone"));

    // Service holen → Dauer
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return new Response("Service nicht gefunden", { status: 400 });
    }

    const startAt = toDate(date, startTime);

    const endAt = new Date(startAt);
    endAt.setMinutes(endAt.getMinutes() + service.durationMinutes);

    // ❗ Doppelbuchung verhindern
    const existing = await prisma.appointment.findFirst({
      where: {
        barberId,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });

    if (existing) {
      return new Response("Zeit ist bereits belegt", { status: 400 });
    }

    // Kunde erstellen / finden
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
        confirmed: true, // Admin = direkt bestätigt
      },
    });

    return Response.redirect(new URL("/admin", req.url));
  } catch (error) {
    console.error("ADMIN BOOK ERROR:", error);
    return new Response("Fehler", { status: 500 });
  }
}
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const barberIdRaw = String(formData.get("barberId") || "");
    const serviceId = String(formData.get("serviceId"));
    const date = String(formData.get("date"));
    const firstName = String(formData.get("firstName"));
    const lastName = String(formData.get("lastName"));
    const phone = String(formData.get("phone") || "");
    const preferredFromTime = String(formData.get("preferredFromTime") || "");
    const preferredToTime = String(formData.get("preferredToTime") || "");

    const anyBarber = barberIdRaw === "any";
    const barberId = anyBarber ? null : barberIdRaw;

    const customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        phone: phone || null,
      },
    });

    await prisma.waitlistEntry.create({
      data: {
        barberId,
        serviceId,
        customerId: customer.id,
        date,
        anyBarber,
        status: "waiting",
        notified: false,
        preferredFromTime: preferredFromTime || null,
        preferredToTime: preferredToTime || null,
      },
    });

    return Response.redirect(new URL("/book", req.url));
  } catch (error) {
    console.error("WAITLIST ERROR:", error);
    return new Response("Fehler beim Speichern der Warteliste", { status: 500 });
  }
}
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const salon = await prisma.salon.findFirst();

    if (!salon) {
      return new Response("Kein Salon gefunden", { status: 404 });
    }

    await prisma.salon.update({
      where: { id: salon.id },
      data: {
        name: String(formData.get("name") || ""),
        bookingIntervalMinutes: Number(formData.get("bookingIntervalMinutes") || 15),
        bookingLeadHours: Number(formData.get("bookingLeadHours") || 0),
        confirmationHours: Number(formData.get("confirmationHours") || 24),
        reminderHours: Number(formData.get("reminderHours") || 2),
      },
    });

    return Response.redirect(new URL("/admin/settings", req.url), 302);
  } catch (error) {
    console.error("SETTINGS ERROR:", error);
    return new Response("Fehler beim Speichern", { status: 500 });
  }
}
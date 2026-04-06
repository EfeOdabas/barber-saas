import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = String(formData.get("name") || "");
    const durationMinutes = Number(formData.get("durationMinutes") || 0);

    const salon = await prisma.salon.findFirst();

    if (!salon) {
      return new Response("Kein Salon gefunden", { status: 404 });
    }

    await prisma.service.create({
      data: {
        name,
        durationMinutes,
        salonId: salon.id,
      },
    });

    return Response.redirect(new URL("/admin/services", req.url));
  } catch (error) {
    console.error("CREATE SERVICE ERROR:", error);
    return new Response("Fehler", { status: 500 });
  }
}
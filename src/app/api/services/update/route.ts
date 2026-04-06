import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "");
    const durationMinutes = Number(formData.get("durationMinutes") || 0);

    await prisma.service.update({
      where: { id },
      data: {
        name,
        durationMinutes,
      },
    });

    return Response.redirect(new URL("/admin/services", req.url));
  } catch (error) {
    console.error("UPDATE SERVICE ERROR:", error);
    return new Response("Fehler", { status: 500 });
  }
}
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const id = String(formData.get("id") || "");

    await prisma.service.delete({
      where: { id },
    });

    return Response.redirect(new URL("/admin/services", req.url));
  } catch (error) {
    console.error("DELETE SERVICE ERROR:", error);
    return new Response("Fehler", { status: 500 });
  }
}
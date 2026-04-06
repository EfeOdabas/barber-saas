import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const id = String(formData.get("id"));

    await prisma.breakTime.delete({
      where: { id },
    });

    return Response.redirect(new URL("/admin/blocks", req.url));
  } catch (error) {
    console.error("BLOCK DELETE ERROR:", error);
    return new Response("Fehler beim Löschen der Blockierung", { status: 500 });
  }
}
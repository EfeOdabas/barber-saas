import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const id = String(formData.get("id"));

    await prisma.waitlistEntry.delete({
      where: { id },
    });

    return Response.redirect(new URL("/admin", req.url));
  } catch (error) {
    console.error("DELETE WAITLIST ERROR:", error);
    return new Response("Fehler beim Löschen des Wartelisten-Eintrags", { status: 500 });
  }
}
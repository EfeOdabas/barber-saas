import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const barberId = String(formData.get("barberId") || "");
    const weekday = Number(formData.get("weekday"));
    const startTime = String(formData.get("startTime") || "");
    const endTime = String(formData.get("endTime") || "");

    if (!barberId || Number.isNaN(weekday)) {
      return new Response("Fehlende Daten", { status: 400 });
    }

    const existing = await prisma.workingHour.findFirst({
      where: {
        barberId,
        weekday,
      },
    });

    if (!startTime || !endTime) {
      if (existing) {
        await prisma.workingHour.delete({
          where: { id: existing.id },
        });
      }

      return Response.redirect(new URL("/admin/working-hours", req.url));
    }

    if (existing) {
      await prisma.workingHour.update({
        where: { id: existing.id },
        data: {
          startTime,
          endTime,
        },
      });
    } else {
      await prisma.workingHour.create({
        data: {
          barberId,
          weekday,
          startTime,
          endTime,
        },
      });
    }

    return Response.redirect(new URL("/admin/working-hours", req.url));
  } catch (error) {
    console.error("WORKING HOURS ERROR:", error);
    return new Response("Fehler", { status: 500 });
  }
}
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const barberId = String(formData.get("barberId"));
    const startDate = String(formData.get("startDate"));
    const endDate = String(formData.get("endDate") || startDate);
    const isFullDay = String(formData.get("isFullDay") || "") === "yes";
    const startTimeRaw = String(formData.get("startTime") || "");
    const endTimeRaw = String(formData.get("endTime") || "");
    const reason = String(formData.get("reason") || "");

    await prisma.breakTime.create({
      data: {
        barberId,
        startDate,
        endDate,
        isFullDay,
        startTime: isFullDay ? null : startTimeRaw || null,
        endTime: isFullDay ? null : endTimeRaw || null,
        reason: reason || null,
      },
    });

    return Response.redirect(new URL("/admin/blocks", req.url));
  } catch (error) {
    console.error("BLOCK CREATE ERROR:", error);
    return new Response("Fehler beim Speichern der Blockierung", { status: 500 });
  }
}
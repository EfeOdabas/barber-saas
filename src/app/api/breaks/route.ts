import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  const formData = await req.formData();

  const barberId = String(formData.get("barberId"));
  const startDate = String(formData.get("startDate"));
  const endDate = String(formData.get("endDate"));
  const isFullDay = formData.get("isFullDay") === "true";

  const startTime = String(formData.get("startTime") || "");
  const endTime = String(formData.get("endTime") || "");
  const reason = String(formData.get("reason") || "");

  await prisma.breakTime.create({
    data: {
      barberId,
      startDate,
      endDate,
      isFullDay,
      startTime: startTime || null,
      endTime: endTime || null,
      reason: reason || null,
    },
  });

  return Response.redirect(new URL("/admin", req.url));
}
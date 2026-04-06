import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  const formData = await req.formData();
  const id = String(formData.get("id"));

  await prisma.breakTime.delete({
    where: { id },
  });

  return Response.redirect(new URL("/admin", req.url));
}
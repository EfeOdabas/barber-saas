import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "../../../lib/auth";

export async function POST(req: Request) {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: 0,
  });

  return Response.redirect(new URL("/admin/login", req.url), 302);
}
import { cookies } from "next/headers";
import { ADMIN_COOKIE, getAdminPassword } from "../../../lib/auth";

export async function POST(req: Request) {
  const formData = await req.formData();
  const password = String(formData.get("password") || "");

  if (password !== getAdminPassword()) {
    return new Response("Falsches Passwort", { status: 401 });
  }

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE, "ok", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: 60 * 60 * 24 * 30,
  });

  return Response.redirect(new URL("/admin", req.url), 302);
}
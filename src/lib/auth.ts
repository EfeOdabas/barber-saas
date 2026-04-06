export const ADMIN_COOKIE = "admin_session";

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "123456";
}
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "./session";

/**
 * Data Access Layer for admin auth — per Next.js's recommended pattern, this is the boundary
 * Server Actions/Server Components check, not src/proxy.ts alone (proxy does an optimistic
 * redirect; this is the real check closest to the data). See claude/10-admin-panel.md.
 */

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

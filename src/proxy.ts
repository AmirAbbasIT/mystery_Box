import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/admin/auth/session";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (middleware is deprecated) — see
// claude/02-architecture.md. This is an optimistic check only: the real check lives in
// src/admin/auth/dal.ts's requireAdmin(), called from every admin Server Action/page, per Next's
// recommended auth pattern (proxy alone is not sufficient — it can be bypassed by Server Actions
// on unmatched routes).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAuthenticated = await verifyAdminSessionToken(token);

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

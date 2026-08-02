import { SignJWT, jwtVerify } from "jose";

/**
 * Pure token sign/verify — no `next/headers`, so this is safe to import from both
 * src/proxy.ts (reads NextRequest cookies directly) and server-only DAL code
 * (src/lib/auth/dal.ts, which reads via next/headers `cookies()`).
 */

export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DURATION = "12h";

function getSecretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set — see .env.local.example");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());
}

export async function verifyAdminSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

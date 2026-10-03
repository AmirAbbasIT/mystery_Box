import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { getPrismaClient } from "@/lib/db/client";

/**
 * Failed-lookup rate limiting for things people might try to guess: promo codes and order
 * tracking (order number + email). Only failures are recorded; a visitor who hits the limit
 * within the window is refused until older failures age out. Must run inside a request (Server
 * Action / Route Handler) since it reads the visitor's IP from the request headers.
 */

export type RateLimitScope = "coupon" | "track";

const MAX_FAILURES = 10;
const WINDOW_MS = 10 * 60 * 1000;
const RETENTION_MS = 24 * 60 * 60 * 1000;

export const TOO_MANY_ATTEMPTS =
  "Too many attempts — please wait a few minutes and try again.";

async function getClientKey(): Promise<string> {
  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown";
  // Store an HMAC rather than the raw IP — enough to rate limit, not a log of visitors' IPs.
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "rate-limit")
    .update(ip)
    .digest("hex");
}

export async function isRateLimited(scope: RateLimitScope): Promise<boolean> {
  const recentFailures = await getPrismaClient().rateLimitHit.count({
    where: {
      scope,
      clientKey: await getClientKey(),
      createdAt: { gt: new Date(Date.now() - WINDOW_MS) },
    },
  });
  return recentFailures >= MAX_FAILURES;
}

export async function recordFailedAttempt(scope: RateLimitScope): Promise<void> {
  const prisma = getPrismaClient();
  await prisma.rateLimitHit.create({ data: { scope, clientKey: await getClientKey() } });
  await prisma.rateLimitHit.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } },
  });
}

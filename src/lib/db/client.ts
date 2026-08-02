import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Server-only Prisma client, singleton across warm serverless invocations. Shared by
 * src/admin/services/*.ts (writes) and src/lib/catalogue.ts (storefront reads) — deliberately
 * lives outside src/admin/ so the storefront doesn't depend on admin-specific code, keeping
 * src/admin/ easy to extract later if that's ever justified (see claude/10-admin-panel.md).
 * Prisma 7 requires an explicit driver adapter (no more reading a connection URL out of
 * schema.prisma) — see claude/09-database-schema.md. Uses DATABASE_URL (the pooled/Supavisor
 * connection), not DIRECT_URL (that's for prisma.config.ts's CLI/migration commands only).
 *
 * getPrismaClient() is deliberately lazy — constructing eagerly at module scope makes Next.js's
 * build-time "collect page data" step throw just from *importing* this module (it evaluates
 * top-level statements even for routes that are dynamic and never render at build time), even
 * though DATABASE_URL is only ever needed once a request actually comes in.
 *
 * The globalThis cache is unconditional — NOT dev-only. On Vercel, "production" still means many
 * short-lived serverless function instances, each of which can be reused ("warm") across several
 * requests; the whole point of caching here is to let a warm instance reuse its pool instead of
 * opening a new one per request. Gating this to dev-only (a common pattern for traditional
 * single-process Node hosting, wrong here) meant production created a brand-new pg.Pool on every
 * single call — this is what caused "max client connections reached" in production; `max: 1`
 * below is the second half of the fix, since DATABASE_URL already points at Supabase's
 * transaction-mode pooler (Supavisor), which does its own multiplexing — each serverless instance
 * should hold as few real connections to it as possible, per Prisma's own serverless guidance.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is missing — copy .env.local.example to .env.local and fill it in.",
    );
  }

  const adapter = new PrismaPg({ connectionString, max: 1 });
  const client = new PrismaClient({ adapter });

  globalForPrisma.prisma = client;

  return client;
}

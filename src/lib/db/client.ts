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

  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

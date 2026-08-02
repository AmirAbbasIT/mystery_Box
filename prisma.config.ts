// CLI-side config (migrate, generate, db pull/push, studio) — Prisma 7 no longer reads
// connection URLs from schema.prisma. Uses DIRECT_URL (not the pooled DATABASE_URL) because
// schema-changing operations need a direct connection, not one going through a transaction-mode
// pooler. The runtime PrismaClient (src/admin/db/client.ts) uses DATABASE_URL via a driver
// adapter instead — see claude/09-database-schema.md.
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.mts",
  },
  datasource: {
    url: process.env.DIRECT_URL,
  },
});

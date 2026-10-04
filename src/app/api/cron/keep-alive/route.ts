import { getPrismaClient } from "@/lib/db/client";

/**
 * Keeps the free-tier Supabase project from auto-pausing. Supabase pauses a Free project that
 * doesn't get "sufficient user database activity" over 7 days ("typically a few user requests to
 * the database each day" — supabase.com/docs/guides/platform/free-project-pausing), so this runs
 * DAILY (vercel.json; the most a Vercel Hobby cron allows) plus a backup GitHub Actions schedule
 * (.github/workflows/keep-alive.yml). Every run makes activity both ways Supabase might measure it:
 * a few real Postgres queries through Prisma, and one request through Supabase's own REST API.
 *
 * Note: this can't wake a project that's already paused — that has to be restored by hand in the
 * Supabase dashboard; afterwards this keeps it awake.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when CRON_SECRET is set in the
 * project's env vars; the GitHub workflow sends the same header. Anything else is rejected.
 */

export const dynamic = "force-dynamic";

async function pingSupabaseApi(): Promise<string> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return "skipped (SUPABASE_URL / SUPABASE_SECRET_KEY not set)";

  // The API root, not a table: tables are deliberately not exposed through Supabase's Data API
  // (Prisma does all data access), so a table request would just be refused. The root still
  // goes through Supabase's API gateway and PostgREST, which is what counts here.
  const response = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/`, {
    headers: { apikey: key },
    cache: "no-store",
  });
  return `HTTP ${response.status}`;
}

export async function GET(request: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prisma = getPrismaClient();
    const [categories, products, orders] = await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.order.count(),
    ]);

    // Best-effort: a REST failure is reported but doesn't fail the run — the queries above are
    // the primary activity.
    const supabaseApi = await pingSupabaseApi().catch(
      (error: unknown) =>
        `failed (${error instanceof Error ? error.message : "unknown"})`,
    );

    const result = {
      ok: true,
      checkedAt: new Date().toISOString(),
      database: { categories, products, orders },
      supabaseApi,
    };
    console.info("Keep-alive", JSON.stringify(result));
    return Response.json(result);
  } catch (error) {
    // Non-2xx so the failure is visible in Vercel's cron logs and the GitHub workflow.
    console.error("Keep-alive: database query failed", error);
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Database query failed",
      },
      { status: 500 },
    );
  }
}

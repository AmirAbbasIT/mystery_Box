import { getPrismaClient } from "@/lib/db/client";

/**
 * Pinged on a schedule (see vercel.json's crons) so the project always has recent database
 * activity — Supabase's free tier auto-pauses a project after 7 days with none, which silently
 * breaks the site until someone notices and un-pauses it in the dashboard.
 *
 * Vercel signs cron requests with `Authorization: Bearer $CRON_SECRET` when that env var is set
 * (Project Settings > Environment Variables in Vercel) — reject anything else so this endpoint
 * can't be used by randoms to hammer the database.
 */
export async function GET(request: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await getPrismaClient().category.count();

  return Response.json({ ok: true, checkedAt: new Date().toISOString() });
}

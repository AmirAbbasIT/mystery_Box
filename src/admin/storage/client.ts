import "server-only";
import ws from "ws";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client, scoped to Storage only — Prisma (src/lib/db/client.ts) owns all
 * Postgres queries. Reintroducing @supabase/supabase-js just for this is the narrow, justified use
 * documented in claude/09-database-schema.md's image-storage note: object storage needs an actual
 * CDN-backed store, not a database column, and Supabase Storage is already provisioned on the same
 * project at no extra cost.
 */

let client: SupabaseClient | null = null;

export function getStorageClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SECRET_KEY are missing — see .env.local.example.",
    );
  }

  // supabase-js always constructs a RealtimeClient internally (even though we only ever use
  // Storage) and throws on Node < 22 without a WebSocket polyfill — hence `ws` here, per the
  // library's own suggested fix.
  client = createClient(url, secretKey, {
    auth: { persistSession: false },
    realtime: { transport: ws as unknown as typeof WebSocket },
  });
  return client;
}

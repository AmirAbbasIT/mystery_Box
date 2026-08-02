// One-time setup: creates the public Storage bucket used for product/category images.
// Run with: node scripts/create-storage-bucket.mjs
// Safe to re-run — no-ops if the bucket already exists.
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

loadEnv({ path: ".env.local" });

const BUCKET_NAME = "catalogue-images";

// supabase-js always constructs a RealtimeClient internally and throws on Node < 22 without a
// WebSocket polyfill, even though this script never uses realtime — see src/admin/storage/client.ts.
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

const { data: existing } = await supabase.storage.listBuckets();
if (existing?.some((bucket) => bucket.name === BUCKET_NAME)) {
  console.log(`Bucket "${BUCKET_NAME}" already exists.`);
  process.exit(0);
}

const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
  public: true,
  fileSizeLimit: "5MB",
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"],
});

if (error) {
  console.error("Failed to create bucket:", error.message);
  process.exit(1);
}

console.log(`Bucket "${BUCKET_NAME}" created (public, 5MB limit, image types only).`);

// Standalone CLI to generate an ADMIN_PIN_HASH value for .env.local — run with plain `node`,
// outside the Next.js server context, so it can't import src/lib/auth/pin.ts (which is guarded
// by "server-only"). Mirrors that file's scrypt salt:hash format exactly — keep both in sync.
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

const pin = process.argv[2];
if (!pin) {
  console.error("Usage: node scripts/hash-admin-pin.mjs <pin>");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const derivedKey = await scryptAsync(pin, salt, KEY_LENGTH);
console.log(`${salt}:${derivedKey.toString("hex")}`);

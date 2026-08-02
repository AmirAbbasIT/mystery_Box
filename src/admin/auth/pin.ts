import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

/** Same salt:hash scrypt format as scripts/hash-admin-pin.mjs — keep both in sync if this changes. */
export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(pin, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = (await scryptAsync(pin, salt, KEY_LENGTH)) as Buffer;
  if (derivedKey.length !== keyBuffer.length) return false;

  return timingSafeEqual(derivedKey, keyBuffer);
}

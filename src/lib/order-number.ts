import "server-only";
import { randomInt } from "node:crypto";

/**
 * Customer-facing order numbers, e.g. "MPG-7K3Q9X": random (not sequential, so they can't be used
 * to guess other orders or reveal order volume), no 0/O/1/I/L lookalikes so they're easy to read
 * out. 31^6 ≈ 887 million combinations; uniqueness is enforced by the DB.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const PREFIX = "MPG-";
const LENGTH = 6;

export function generateOrderNumber(): string {
  let code = "";
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return PREFIX + code;
}

/** Lenient input: any case, spaces, with or without the "MPG-" prefix. Null if it can't match. */
export function normaliseOrderNumber(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const compact = input.toUpperCase().replace(/[\s-]/g, "").replace(/^MPG/, "");
  return new RegExp(`^[${ALPHABET}]{${LENGTH}}$`).test(compact) ? PREFIX + compact : null;
}

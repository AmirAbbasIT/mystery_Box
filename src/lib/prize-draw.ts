import "server-only";
import { randomInt } from "node:crypto";

/**
 * Server-side prize draws for paid egg packs and wheel spins. Uses Node's cryptographic RNG (not
 * Math.random) so outcomes can't be predicted, and draws strictly by the published weights —
 * the same weights the egg/wheel pages turn into the odds customers see before buying.
 */

export interface DrawablePrize {
  id: string;
  label: string;
  rarity: string;
  weight: number;
}

/** Weights are decimals in the DB; scaling to integers keeps randomInt exact. */
const WEIGHT_SCALE = 1000;

export function drawPrize<T extends DrawablePrize>(prizes: T[]): T {
  const eligible = prizes.filter((prize) => prize.weight > 0);
  if (eligible.length === 0)
    throw new Error("Prize pool has no prizes with a positive weight.");

  const scaled = eligible.map((prize) =>
    Math.max(1, Math.round(prize.weight * WEIGHT_SCALE)),
  );
  const total = scaled.reduce((sum, weight) => sum + weight, 0);

  let roll = randomInt(total); // uniform integer in [0, total)
  for (let i = 0; i < eligible.length; i++) {
    roll -= scaled[i];
    if (roll < 0) return eligible[i];
  }
  return eligible[eligible.length - 1];
}

export function totalWeight(prizes: DrawablePrize[]): number {
  return prizes.reduce((sum, prize) => sum + Math.max(0, prize.weight), 0);
}

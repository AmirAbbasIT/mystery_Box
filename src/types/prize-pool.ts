export type PrizeRarity = "common" | "uncommon" | "rare" | "jackpot";

export interface PrizeItem {
  id: string;
  label: string;
  rarity: PrizeRarity;
  /** Relative odds weighting — admin-editable in Phase 2, static here. */
  weight: number;
}

export type PrizePoolKind = "wheel" | "egg";

export interface PrizePool {
  id: string;
  slug: string;
  name: string;
  kind: PrizePoolKind;
  /** Number of eggs in this tier; undefined for wheel/single-item pools. */
  quantity?: number;
  price: number;
  image: string;
  prizes: PrizeItem[];
}

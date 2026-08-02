"use client";

import { motion } from "framer-motion";
import { Badge, Button } from "@/components/ui";
import type { PrizeItem } from "@/types";
import styles from "./RevealPanel.module.scss";

interface RevealPanelProps {
  prize: PrizeItem;
  onReset: () => void;
  resetLabel?: string;
}

const RARITY_LABEL: Record<PrizeItem["rarity"], string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  jackpot: "Jackpot!",
};

const RARITY_TONE: Record<PrizeItem["rarity"], "neutral" | "secondary" | "primary" | "accent"> = {
  common: "neutral",
  uncommon: "secondary",
  rare: "primary",
  jackpot: "accent",
};

export function RevealPanel({ prize, onReset, resetLabel = "Go again" }: RevealPanelProps) {
  return (
    <motion.div
      className={styles.panel}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <Badge tone={RARITY_TONE[prize.rarity]}>{RARITY_LABEL[prize.rarity]}</Badge>
      <p className={styles.wonLabel}>You won</p>
      <p className={styles.prizeName}>{prize.label}</p>
      <Button variant="outline" size="sm" onClick={onReset}>
        {resetLabel}
      </Button>
    </motion.div>
  );
}

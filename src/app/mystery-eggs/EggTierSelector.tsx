"use client";

import { useState } from "react";
import { PriceTag } from "@/components/product";
import { EggRevealLoader } from "@/components/animations";
import { cx } from "@/lib/utils";
import type { PrizePool } from "@/types";
import styles from "./EggTierSelector.module.scss";

interface EggTierSelectorProps {
  tiers: PrizePool[];
}

export function EggTierSelector({ tiers }: EggTierSelectorProps) {
  const [activeTierId, setActiveTierId] = useState(tiers[0]?.id);
  const activeTier = tiers.find((tier) => tier.id === activeTierId) ?? tiers[0];
  const quantity = activeTier.quantity ?? 1;

  return (
    <div>
      <div className={styles.tierButtons} role="group" aria-label="Choose an egg tier">
        {tiers.map((tier) => {
          const isActive = tier.id === activeTier.id;
          const tierQuantity = tier.quantity ?? 1;
          return (
            <button
              key={tier.id}
              type="button"
              className={cx(styles.tierButton, isActive && styles.tierButtonActive)}
              aria-pressed={isActive}
              onClick={() => setActiveTierId(tier.id)}
            >
              <span className={styles.tierQuantity}>
                {tierQuantity} egg{tierQuantity > 1 ? "s" : ""}
              </span>
              <PriceTag price={tier.price} />
            </button>
          );
        })}
      </div>

      <div className={styles.eggGrid}>
        {Array.from({ length: quantity }).map((_, index) => (
          <EggRevealLoader
            key={`${activeTier.id}-${index}`}
            prizes={activeTier.prizes}
            label={`Egg ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

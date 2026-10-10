"use client";

import { useState } from "react";
import { AddToBasketButton, PriceTag } from "@/components/product";
import { EggRevealLoader } from "@/components/animations";
import { Accordion, AccordionItem } from "@/components/ui";
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
  const totalWeight = activeTier.prizes.reduce((sum, prize) => sum + prize.weight, 0);

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

      <div className={styles.buy}>
        <AddToBasketButton
          item={{
            kind: "prize_pool",
            id: activeTier.id,
            name: activeTier.name,
            price: activeTier.price,
            image: activeTier.image,
          }}
        />
        <p className={styles.buyNote}>
          Each egg is hand-packed with a prize drawn at random, using the odds below, when
          you pay. The surprise stays inside the egg until you open it.
        </p>
      </div>

      <section className={styles.odds}>
        <Accordion>
          <AccordionItem title={`What could be inside — ${activeTier.name}`} defaultOpen>
            <ul role="list" className={styles.oddsList}>
              {activeTier.prizes.map((prize) => (
                <li key={prize.id} className={styles.oddsRow}>
                  <span>{prize.label}</span>
                  <span>
                    {totalWeight > 0
                      ? ((prize.weight / totalWeight) * 100).toFixed(0)
                      : 0}
                    %
                  </span>
                </li>
              ))}
            </ul>
            <p className={styles.buyNote}>Chance per egg. Every egg contains a prize.</p>
          </AccordionItem>
        </Accordion>
      </section>

      <h2 className={styles.previewHeading}>Try a free preview crack</h2>
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

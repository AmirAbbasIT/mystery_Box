import type { Metadata } from "next";
import { prizePools } from "@/data";
import { Accordion, AccordionItem } from "@/components/ui";
import { EggTierSelector } from "./EggTierSelector";
import styles from "./page.module.scss";

const eggTiers = prizePools
  .filter((pool) => pool.kind === "egg")
  .sort((a, b) => (a.quantity ?? 1) - (b.quantity ?? 1));

export const metadata: Metadata = {
  title: "Mystery Pink Eggs",
  description: "Crack open a mystery pink egg — choose single, 5, 10 or 15 pack tiers.",
};

export default function MysteryEggsPage() {
  const allPrizeLabels = Array.from(
    new Set(eggTiers.flatMap((tier) => tier.prizes.map((prize) => prize.label))),
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Mystery Pink Eggs</h1>
        <p>
          Pick a tier and try a preview crack below — no purchase needed to see how the reveal
          feels.
        </p>
      </header>

      <EggTierSelector tiers={eggTiers} />

      <section className={styles.odds}>
        <Accordion>
          <AccordionItem title="What could be inside?">
            <ul role="list" className={styles.oddsList}>
              {allPrizeLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}

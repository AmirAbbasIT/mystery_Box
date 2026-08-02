import type { Metadata } from "next";
import { getEggPrizePools } from "@/lib/catalogue";
import { Accordion, AccordionItem } from "@/components/ui";
import { EggTierSelector } from "./EggTierSelector";
import styles from "./page.module.scss";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Mystery Pink Eggs",
  description: "Crack open a mystery pink egg — choose single, 5, 10 or 15 pack tiers.",
};

export default async function MysteryEggsPage() {
  const eggTiers = await getEggPrizePools();

  if (eggTiers.length === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Mystery Pink Eggs</h1>
          <p>Fresh eggs are being prepared — check back soon.</p>
        </header>
      </div>
    );
  }

  const allPrizeLabels = Array.from(
    new Set(eggTiers.flatMap((tier) => tier.prizes.map((prize) => prize.label))),
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Mystery Pink Eggs</h1>
        <p>
          Pick a tier and try a preview crack below — no purchase needed. Every real order gets its
          own genuine surprise, randomised to these exact published odds.
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

import type { Metadata } from "next";
import { getWheelPrizePool } from "@/lib/catalogue";
import { WheelSpinLoader } from "@/components/animations";
import { PriceTag } from "@/components/product";
import { Accordion, AccordionItem } from "@/components/ui";
import styles from "./page.module.scss";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const wheelPool = await getWheelPrizePool();
  if (!wheelPool) return { title: "Wheel Spin" };
  return {
    title: wheelPool.name,
    description: "Spin the Luxury Wheel for a guaranteed prize — see the full odds before you play.",
  };
}

export default async function WheelSpinPage() {
  const wheelPool = await getWheelPrizePool();

  if (!wheelPool) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Wheel Spin</h1>
          <p>The wheel is being restocked with prizes — check back soon.</p>
        </header>
      </div>
    );
  }

  const totalWeight = wheelPool.prizes.reduce((sum, prize) => sum + prize.weight, 0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{wheelPool.name}</h1>
        <p>One spin, one guaranteed prize. No repeats, no losers — just varying rarity.</p>
        <PriceTag price={wheelPool.price} />
      </header>

      <div className={styles.wheelWrapper}>
        <WheelSpinLoader prizes={wheelPool.prizes} />
      </div>

      <section className={styles.odds}>
        <Accordion>
          <AccordionItem title="What are the odds?" defaultOpen>
            <ul role="list" className={styles.oddsList}>
              {wheelPool.prizes.map((prize) => (
                <li key={prize.id} className={styles.oddsRow}>
                  <span>{prize.label}</span>
                  <span>{((prize.weight / totalWeight) * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getWheelPrizePool } from "@/lib/catalogue";
import { WheelSpinLoader } from "@/components/animations";
import { AddToBasketButton } from "@/components/product";
import { Accordion, AccordionItem } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import styles from "./page.module.scss";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const wheelPool = await getWheelPrizePool();
  return pageMetadata({
    title: wheelPool?.name ?? "Wheel Spin",
    description:
      "Spin the mystery prize wheel — every spin wins a prize, with every prize and its odds shown up front. UK delivery.",
    path: "/wheel-spin",
  });
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
        <p>
          Every spin wins a prize. Buy a spin and it&rsquo;s drawn securely, using the
          odds below, the moment you pay — then you spin to reveal it straight after
          checkout and we post the prize to you.
        </p>
        <AddToBasketButton
          item={{
            kind: "prize_pool",
            id: wheelPool.id,
            name: wheelPool.name,
            price: wheelPool.price,
            image: wheelPool.image,
          }}
          label={`Buy a Spin — ${formatPrice(wheelPool.price)}`}
        />
      </header>

      <h2 className={styles.previewHeading}>Try a free preview spin</h2>

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

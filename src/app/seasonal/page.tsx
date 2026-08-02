import type { Metadata } from "next";
import Image from "next/image";
import { seasonalCollections } from "@/data";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Seasonal & Limited Edition",
  description: "Christmas, Valentine's, Mother's Day and Easter mystery box drops.",
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function SeasonalPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Seasonal & Limited Edition</h1>
        <p>Themed drops tied to the UK gifting calendar — bookmark this page.</p>
      </header>

      <div className={styles.grid}>
        {seasonalCollections.map((collection) => (
          <article key={collection.id} className={styles.card}>
            <div className={styles.imageWrapper}>
              <Image
                src={collection.heroImage}
                alt=""
                fill
                sizes="(max-width: 600px) 90vw, 360px"
                className={styles.image}
              />
            </div>
            <div className={styles.body}>
              <h2>{collection.name}</h2>
              <p className={styles.description}>{collection.description}</p>
              <p className={styles.dates}>
                {dateFormatter.format(new Date(collection.startsAt))} –{" "}
                {dateFormatter.format(new Date(collection.endsAt))}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

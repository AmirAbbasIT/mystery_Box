"use client";

import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/types";
import type { ShopExtrasPricing } from "@/lib/catalogue";
import { PriceTag } from "@/components/product";
import styles from "./ShopByCategory.module.scss";

interface ShopByCategoryProps {
  categories: Category[];
  pricing: ShopExtrasPricing;
}

export function ShopByCategory({ categories, pricing }: ShopByCategoryProps) {
  const extraEntries = [
    {
      slug: "mystery-eggs",
      name: "Mystery Pink Eggs",
      tagline: "Crack open a pack of mystery eggs.",
      image: "/images/products/egg.svg",
      href: "/mystery-eggs",
      priceFrom: pricing.eggsFrom,
    },
    {
      slug: "wheel-spin",
      name: "Wheel Spin",
      tagline: "One spin, one guaranteed prize.",
      image: "/images/products/wheel.svg",
      href: "/wheel-spin",
      priceFrom: pricing.wheelSpin,
    },
    {
      slug: "birthday-packages",
      name: "Birthday Packages",
      tagline: "Kids party boxes to adult milestone boxes.",
      image: "/images/products/birthday-kids.svg",
      href: "/birthday-packages",
      priceFrom: pricing.birthdayPackagesFrom,
    },
  ];

  const categoryEntries = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    tagline: category.tagline,
    image: category.heroImage,
    href: `/shop/${category.slug}`,
    priceFrom: category.priceFrom,
  }));

  const entries = [...categoryEntries, ...extraEntries];

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Shop by category</h2>
        <p>Gifts for every occasion, plus eggs, spins and party boxes.</p>
      </div>
      <div className={styles.grid}>
        {entries.map((entry) => (
          <Link key={entry.slug} href={entry.href} className={styles.card}>
            <div className={styles.imageWrapper}>
              <Image
                src={entry.image}
                alt=""
                fill
                sizes="(max-width: 600px) 45vw, (max-width: 1024px) 30vw, 220px"
                className={styles.image}
              />
            </div>
            <h3 className={styles.name}>{entry.name}</h3>
            <p className={styles.tagline}>{entry.tagline}</p>
            {entry.priceFrom !== null && <PriceTag price={entry.priceFrom} from />}
          </Link>
        ))}
      </div>
    </section>
  );
}

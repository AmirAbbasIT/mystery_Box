"use client";

import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/types";
import { PriceTag } from "@/components/product";
import styles from "./ShopByCategory.module.scss";

const EXTRA_ENTRIES = [
  {
    slug: "mystery-eggs",
    name: "Mystery Pink Eggs",
    tagline: "Crack one open — single eggs up to a 15-pack.",
    image: "/images/products/egg.svg",
    href: "/mystery-eggs",
    priceFrom: 5,
  },
  {
    slug: "wheel-spin",
    name: "Wheel Spin",
    tagline: "One spin, one guaranteed prize.",
    image: "/images/products/wheel.svg",
    href: "/wheel-spin",
    priceFrom: 15,
  },
  {
    slug: "birthday-packages",
    name: "Birthday Packages",
    tagline: "Kids party favours to adult milestone boxes.",
    image: "/images/products/birthday-kids.svg",
    href: "/birthday-packages",
    priceFrom: 3.5,
  },
];

interface ShopByCategoryProps {
  categories: Category[];
}

export function ShopByCategory({ categories }: ShopByCategoryProps) {
  const categoryEntries = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    tagline: category.tagline,
    image: category.heroImage,
    href: `/shop/${category.slug}`,
    priceFrom: category.priceFrom,
  }));

  const entries = [...categoryEntries, ...EXTRA_ENTRIES];

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Shop by category</h2>
        <p>Six ways to get your surprise fix.</p>
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
            <PriceTag price={entry.priceFrom} from />
          </Link>
        ))}
      </div>
    </section>
  );
}

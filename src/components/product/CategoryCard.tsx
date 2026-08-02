"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Category } from "@/types";
import { PriceTag } from "./PriceTag";
import styles from "./CategoryCard.module.scss";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <motion.div
      className={styles.wrapper}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      <Link href={`/shop/${category.slug}`} className={styles.card}>
        <div className={styles.imageWrapper}>
          <Image
            src={category.heroImage}
            alt=""
            fill
            sizes="(max-width: 600px) 90vw, (max-width: 1024px) 45vw, 320px"
            className={styles.image}
          />
        </div>
        <div className={styles.content}>
          <h3 className={styles.name}>{category.name}</h3>
          <p className={styles.tagline}>{category.tagline}</p>
          <PriceTag price={category.priceFrom} from />
        </div>
      </Link>
    </motion.div>
  );
}

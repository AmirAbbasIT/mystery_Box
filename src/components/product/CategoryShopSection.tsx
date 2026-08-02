import type { Product, Theme } from "@/types";
import { ProductFilterGrid } from "./ProductFilterGrid";
import styles from "./CategoryShopSection.module.scss";

interface CategoryShopSectionProps {
  title: string;
  tagline: string;
  products: Product[];
  themes: Theme[];
}

export function CategoryShopSection({ title, tagline, products, themes }: CategoryShopSectionProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{title}</h1>
        <p>{tagline}</p>
      </header>
      <ProductFilterGrid products={products} themes={themes} />
    </div>
  );
}

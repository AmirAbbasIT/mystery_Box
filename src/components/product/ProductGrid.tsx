import type { Product, Theme } from "@/types";
import { ProductCard } from "./ProductCard";
import styles from "./ProductGrid.module.scss";

interface ProductGridProps {
  products: Product[];
  themes: Theme[];
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  themes,
  emptyMessage = "No products match these filters yet.",
}: ProductGridProps) {
  if (products.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.grid} role="list">
      {products.map((product) => (
        <div role="listitem" key={product.id}>
          <ProductCard product={product} themes={themes} />
        </div>
      ))}
    </div>
  );
}

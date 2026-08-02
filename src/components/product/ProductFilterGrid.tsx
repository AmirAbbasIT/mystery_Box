"use client";

import { useMemo, useState } from "react";
import { cx } from "@/lib/utils";
import type { Product, Theme } from "@/types";
import { ProductGrid } from "./ProductGrid";
import styles from "./ProductFilterGrid.module.scss";

interface ProductFilterGridProps {
  products: Product[];
  themes: Theme[];
}

type SortOption = "featured" | "price-asc" | "price-desc";

export function ProductFilterGrid({ products, themes }: ProductFilterGridProps) {
  const [activeThemeIds, setActiveThemeIds] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>("featured");

  const availableThemes = useMemo(() => {
    const ids = new Set(products.flatMap((product) => product.themeIds));
    return themes.filter((theme) => ids.has(theme.id));
  }, [products, themes]);

  const toggleTheme = (themeId: string) => {
    setActiveThemeIds((current) =>
      current.includes(themeId) ? current.filter((id) => id !== themeId) : [...current, themeId],
    );
  };

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeThemeIds.length > 0) {
      list = list.filter((product) =>
        product.themeIds.some((themeId) => activeThemeIds.includes(themeId)),
      );
    }

    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "featured") sorted.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));
    return sorted;
  }, [products, activeThemeIds, sort]);

  return (
    <div>
      <div className={styles.controls}>
        {availableThemes.length > 0 && (
          <div className={styles.themeFilters} role="group" aria-label="Filter by theme">
            {availableThemes.map((theme) => {
              const isActive = activeThemeIds.includes(theme.id);
              return (
                <button
                  key={theme.id}
                  type="button"
                  className={cx(styles.themeChip, isActive && styles.themeChipActive)}
                  aria-pressed={isActive}
                  onClick={() => toggleTheme(theme.id)}
                >
                  {theme.name}
                </button>
              );
            })}
          </div>
        )}

        <label className={styles.sortLabel}>
          Sort by
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </label>
      </div>

      <ProductGrid
        products={filteredProducts}
        themes={themes}
        emptyMessage="No boxes match this theme yet — try clearing filters."
      />
    </div>
  );
}

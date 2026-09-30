import type { Metadata } from "next";
import { getCategories, getProducts, getThemes } from "@/lib/catalogue";
import { CategoryCard, ProductGrid } from "@/components/product";
import styles from "./page.module.scss";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop Mystery Boxes",
  description:
    "Mystery gift boxes for birthdays, weddings and the seasons — pick an occasion and a theme.",
};

export default async function ShopIndexPage() {
  const [categories, products, themes] = await Promise.all([
    getCategories(),
    getProducts(),
    getThemes(),
  ]);
  const featuredProducts = products.filter((product) => product.featured);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Shop Mystery Boxes</h1>
        <p>A mystery box for every occasion — pick yours and let the reveal do the rest.</p>
      </header>

      <section className={styles.categories} aria-label="Categories">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </section>

      {featuredProducts.length > 0 && (
        <section className={styles.featured}>
          <h2>Bestsellers</h2>
          <ProductGrid products={featuredProducts} themes={themes} />
        </section>
      )}
    </div>
  );
}

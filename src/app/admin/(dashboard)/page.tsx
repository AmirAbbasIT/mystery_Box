import Link from "next/link";
import { listProducts } from "@/admin/services/products.service";
import { listCategories } from "@/admin/services/categories.service";
import { listThemes } from "@/admin/services/themes.service";
import styles from "./home.module.scss";

export default async function AdminDashboardPage() {
  const [products, categories, themes] = await Promise.all([
    listProducts(),
    listCategories(),
    listThemes(),
  ]);
  const activeCount = products.filter((product) => product.active).length;

  return (
    <div>
      <h1 className={styles.title}>Dashboard</h1>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <p className={styles.statValue}>{products.length}</p>
          <p className={styles.statLabel}>Products</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{activeCount}</p>
          <p className={styles.statLabel}>Active</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{categories.length}</p>
          <p className={styles.statLabel}>Categories</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{themes.length}</p>
          <p className={styles.statLabel}>Themes</p>
        </div>
      </div>
      <Link href="/admin/products" className={styles.link}>
        Manage products →
      </Link>
    </div>
  );
}

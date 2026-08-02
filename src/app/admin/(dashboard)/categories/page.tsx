import Link from "next/link";
import { listCategories } from "@/admin/services/categories.service";
import { deleteCategoryAction } from "./actions";
import styles from "./categories.module.scss";

interface CategoriesPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminCategoriesPage({ searchParams }: CategoriesPageProps) {
  const [categories, { error }] = await Promise.all([listCategories(), searchParams]);

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Categories</h1>
        <Link href="/admin/categories/new" className={styles.newLink}>
          + New category
        </Link>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Products</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td>{category.name}</td>
              <td>{category.slug}</td>
              <td>{category.productCount}</td>
              <td className={styles.actions}>
                <Link href={`/admin/categories/${category.id}`}>Edit</Link>
                <form action={deleteCategoryAction.bind(null, category.id)}>
                  <button type="submit" className={styles.deleteButton}>
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {categories.length === 0 && (
            <tr>
              <td colSpan={4}>No categories yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

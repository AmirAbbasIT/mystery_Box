import Link from "next/link";
import { listThemes } from "@/admin/services/themes.service";
import { deleteThemeAction } from "./actions";
import styles from "./themes.module.scss";

export default async function AdminThemesPage() {
  const themes = await listThemes();

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Themes</h1>
        <Link href="/admin/themes/new" className={styles.newLink}>
          + New theme
        </Link>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Swatch</th>
            <th>Name</th>
            <th>Slug</th>
            <th>Products</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {themes.map((theme) => (
            <tr key={theme.id}>
              <td>
                <span className={styles.swatchDot} style={{ backgroundColor: theme.colorSwatch }} />
              </td>
              <td>{theme.name}</td>
              <td>{theme.slug}</td>
              <td>{theme.productCount}</td>
              <td className={styles.actions}>
                <Link href={`/admin/themes/${theme.id}`}>Edit</Link>
                <form action={deleteThemeAction.bind(null, theme.id)}>
                  <button type="submit" className={styles.deleteButton}>
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {themes.length === 0 && (
            <tr>
              <td colSpan={5}>No themes yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

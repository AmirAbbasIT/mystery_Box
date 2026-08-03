import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { listBirthdayPackages } from "@/admin/services/birthday-packages.service";
import { deleteBirthdayPackageAction } from "./actions";
import styles from "./birthday-packages.module.scss";

const AUDIENCE_LABELS: Record<string, string> = {
  kids: "Kids",
  "adult-party": "Adult Party",
};

export default async function AdminBirthdayPackagesPage() {
  const packages = await listBirthdayPackages();

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Birthday Packages</h1>
        <Link href="/admin/birthday-packages/new" className={styles.newLink}>
          + New package
        </Link>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Audience</th>
            <th>Price from</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => (
            <tr key={pkg.id}>
              <td>{pkg.name}</td>
              <td>{AUDIENCE_LABELS[pkg.audience] ?? pkg.audience}</td>
              <td>{formatPrice(pkg.priceFromPence / 100)}</td>
              <td className={styles.actions}>
                <Link href={`/admin/birthday-packages/${pkg.id}`}>Edit</Link>
                <form action={deleteBirthdayPackageAction.bind(null, pkg.id)}>
                  <button type="submit" className={styles.deleteButton}>
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {packages.length === 0 && (
            <tr>
              <td colSpan={4}>No birthday packages yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

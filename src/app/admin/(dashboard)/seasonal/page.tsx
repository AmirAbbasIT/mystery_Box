import Link from "next/link";
import { listSeasonalCollections } from "@/admin/services/seasonal-collections.service";
import { deleteSeasonalCollectionAction } from "./actions";
import styles from "./seasonal.module.scss";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminSeasonalPage() {
  const collections = await listSeasonalCollections();

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Seasonal Collections</h1>
        <Link href="/admin/seasonal/new" className={styles.newLink}>
          + New collection
        </Link>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Dates</th>
            <th>Products</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {collections.map((collection) => (
            <tr key={collection.id}>
              <td>{collection.name}</td>
              <td>
                {dateFormatter.format(new Date(collection.startsAt))} –{" "}
                {dateFormatter.format(new Date(collection.endsAt))}
              </td>
              <td>{collection.productIds.length}</td>
              <td className={styles.actions}>
                <Link href={`/admin/seasonal/${collection.id}`}>Edit</Link>
                <form action={deleteSeasonalCollectionAction.bind(null, collection.id)}>
                  <button type="submit" className={styles.deleteButton}>
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {collections.length === 0 && (
            <tr>
              <td colSpan={4}>No seasonal collections yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

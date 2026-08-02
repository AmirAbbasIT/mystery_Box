import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { listPrizePools } from "@/admin/services/prize-pools.service";
import { deletePrizePoolAction } from "./actions";
import styles from "./prize-pools.module.scss";

export default async function AdminPrizePoolsPage() {
  const prizePools = await listPrizePools();

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Prize Pools</h1>
        <Link href="/admin/prize-pools/new" className={styles.newLink}>
          + New prize pool
        </Link>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Kind</th>
            <th>Price</th>
            <th>Prizes</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {prizePools.map((pool) => (
            <tr key={pool.id}>
              <td>{pool.name}</td>
              <td>{pool.kind === "wheel" ? "Wheel Spin" : `Egg × ${pool.quantity}`}</td>
              <td>{formatPrice(pool.pricePence / 100)}</td>
              <td>{pool.prizeItems.length}</td>
              <td className={styles.actions}>
                <Link href={`/admin/prize-pools/${pool.id}`}>Edit</Link>
                <form action={deletePrizePoolAction.bind(null, pool.id)}>
                  <button type="submit" className={styles.deleteButton}>
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {prizePools.length === 0 && (
            <tr>
              <td colSpan={5}>No prize pools yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

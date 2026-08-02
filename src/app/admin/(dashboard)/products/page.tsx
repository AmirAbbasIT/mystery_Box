import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { listProducts } from "@/admin/services/products.service";
import { deleteProductAction } from "./actions";
import styles from "./products.module.scss";

export default async function AdminProductsPage() {
  const products = await listProducts();

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Products</h1>
        <Link href="/admin/products/new" className={styles.newLink}>
          + New product
        </Link>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Active</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.categoryName}</td>
              <td>{formatPrice(product.pricePence / 100)}</td>
              <td>{product.stock}</td>
              <td>{product.active ? "Yes" : "No"}</td>
              <td className={styles.actions}>
                <Link href={`/admin/products/${product.id}`}>Edit</Link>
                <form action={deleteProductAction.bind(null, product.id)}>
                  <button type="submit" className={styles.deleteButton}>
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={6}>No products yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

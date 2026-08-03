import Link from "next/link";
import { listCustomers } from "@/admin/services/customers.service";
import styles from "./customers.module.scss";

interface AdminCustomersPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  const { email } = await searchParams;
  const customers = await listCustomers(email);

  return (
    <div>
      <h1 className={styles.title}>Customers</h1>

      <form className={styles.searchForm}>
        <input type="search" name="email" placeholder="Search by email" defaultValue={email} />
        <button type="submit" className={styles.searchButton}>
          Search
        </button>
      </form>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Orders</th>
            <th>Since</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.name}</td>
              <td>{customer.email}</td>
              <td>{customer.orderCount}</td>
              <td>{new Date(customer.createdAt).toLocaleDateString("en-GB")}</td>
              <td>
                <Link href={`/admin/customers/${customer.id}`}>View</Link>
              </td>
            </tr>
          ))}
          {customers.length === 0 && (
            <tr>
              <td colSpan={5}>No customers found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

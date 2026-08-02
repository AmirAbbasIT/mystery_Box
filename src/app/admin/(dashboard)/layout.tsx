import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/admin/auth/dal";
import { logout } from "../login/actions";
import styles from "./dashboard.module.scss";

const NAV_LINKS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Themes", href: "/admin/themes" },
  { label: "Prize Pools", href: "/admin/prize-pools" },
  { label: "Settings", href: "/admin/settings" },
];

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <p className={styles.brand}>Mystery Box Admin</p>
        <nav>
          <ul className={styles.navList}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.navLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form action={logout}>
          <button type="submit" className={styles.logout}>
            Sign out
          </button>
        </form>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cx } from "@/lib/utils";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { useCart } from "@/lib/cart/CartContext";
import { MobileNav } from "./MobileNav";
import styles from "./Header.module.scss";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} aria-label={`${SITE_NAME} home`}>
          <Image src="/images/brand/logo.jpg" alt="" width={48} height={48} priority />
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary">
          <ul className={styles.navList} role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.navLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link href="/basket" className={styles.basketLink} aria-label={`Basket, ${itemCount} item${itemCount === 1 ? "" : "s"}`}>
          <span aria-hidden="true">Basket</span>
          {itemCount > 0 && <span className={styles.basketCount}>{itemCount}</span>}
        </Link>

        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className={cx(styles.burgerLine, isMenuOpen && styles.burgerLineTop)} />
          <span className={cx(styles.burgerLine, isMenuOpen && styles.burgerLineHidden)} />
          <span className={cx(styles.burgerLine, isMenuOpen && styles.burgerLineBottom)} />
        </button>
      </div>

      <MobileNav id="mobile-nav" isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  );
}

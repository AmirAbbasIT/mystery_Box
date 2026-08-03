import Link from "next/link";
import Image from "next/image";
import { CONTACT_EMAIL, FOOTER_LINKS, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import styles from "./Footer.module.scss";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Image
            src="/images/brand/logo.jpg"
            alt={SITE_NAME}
            width={56}
            height={56}
            className={styles.logo}
          />
          <p className={styles.brandName}>{SITE_NAME}</p>
          <p className={styles.tagline}>{SITE_TAGLINE}</p>
          <p className={styles.familyNote}>
            Family-run, UK-based, and obsessed with the reveal moment as much as you are.
          </p>
        </div>

        <nav className={styles.linksColumn} aria-label="Footer">
          <p className={styles.columnTitle}>Company</p>
          <ul role="list" className={styles.linkList}>
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.link}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.linksColumn}>
          <p className={styles.columnTitle}>Get in touch</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className={styles.link}>
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <p>
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

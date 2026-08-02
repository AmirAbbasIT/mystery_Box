"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./error.module.scss";

/**
 * Wraps everything under /admin (login + dashboard) in a React Error Boundary, per Next's
 * file-convention error.tsx — see node_modules/next/dist/docs/.../file-conventions/error.md.
 * Without this, an unhandled throw (e.g. a transient "Can't reach database server" from Prisma)
 * shows Next's raw dev/prod crash overlay instead of a page the admin can actually use.
 *
 * error.message is only the real message in development — in production Next replaces
 * Server-Component error messages with a generic one + `digest`, deliberately, to avoid leaking
 * internals to the client. Both are shown here; digest is what you'd grep server logs for.
 */
export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.description}>
          There was a technical issue loading this page — often a temporary database connection
          hiccup. Try again, or head back to the dashboard.
        </p>

        <div className={styles.details}>
          <p className={styles.detailsLabel}>Error details</p>
          <p className={styles.detailsMessage}>{error.message || "No message available."}</p>
          {error.digest && <p className={styles.detailsDigest}>Digest: {error.digest}</p>}
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={() => unstable_retry()} className={styles.retryButton}>
            Try again
          </button>
          <Link href="/admin" className={styles.dashboardLink}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui";
import styles from "./error.module.scss";

/**
 * Root error boundary — Products/Categories/Themes are DB-backed now (see
 * claude/09-database-schema.md), so storefront pages can hit a transient DB error the way
 * src/app/admin/error.tsx already handles for the admin panel. Same dev-vs-production nuance
 * applies: error.message is the real message only in development; production shows a generic
 * message + digest to avoid leaking internals.
 */
export default function ErrorPage({
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
    <div className={styles.page}>
      <Image
        src="/images/products/egg.svg"
        alt=""
        width={140}
        height={140}
        className={styles.image}
      />
      <h1>This box got scrambled.</h1>
      <p>Something went wrong loading this page — often just a temporary hiccup.</p>

      <div className={styles.details}>
        <p className={styles.detailsLabel}>Error details</p>
        <p className={styles.detailsMessage}>{error.message || "No message available."}</p>
        {error.digest && <p className={styles.detailsDigest}>Digest: {error.digest}</p>}
      </div>

      <div className={styles.actions}>
        <Button onClick={() => unstable_retry()}>Try again</Button>
        <Button href="/" variant="outline">
          Back to Home
        </Button>
      </div>
    </div>
  );
}

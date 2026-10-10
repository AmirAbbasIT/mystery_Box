"use client";

import dynamic from "next/dynamic";
import type { PrizeItem } from "@/types";
import styles from "./WheelSpin.module.scss";

const WheelSpin = dynamic(() => import("./WheelSpin").then((mod) => mod.WheelSpin), {
  ssr: false,
  loading: () => (
    <div className={styles.wheelArea} aria-hidden="true">
      <div className={styles.disc} style={{ background: "var(--color-surface-sunk)" }} />
    </div>
  ),
});

interface WheelSpinLoaderProps {
  prizes: PrizeItem[];
  /** Reveal mode — see WheelSpin. */
  winners?: string[];
}

export function WheelSpinLoader({ prizes, winners }: WheelSpinLoaderProps) {
  return <WheelSpin prizes={prizes} winners={winners} />;
}

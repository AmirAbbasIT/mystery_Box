"use client";

import dynamic from "next/dynamic";
import type { PrizeItem } from "@/types";
import styles from "./EggReveal.module.scss";

const EggReveal = dynamic(() => import("./EggReveal").then((mod) => mod.EggReveal), {
  ssr: false,
  loading: () => <div className={styles.egg} aria-hidden="true" />,
});

interface EggRevealLoaderProps {
  prizes: PrizeItem[];
  label?: string;
}

export function EggRevealLoader({ prizes, label }: EggRevealLoaderProps) {
  return <EggReveal prizes={prizes} label={label} />;
}

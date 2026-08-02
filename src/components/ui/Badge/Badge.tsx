import type { ReactNode } from "react";
import { cx } from "@/lib/utils";
import styles from "./Badge.module.scss";

type Tone = "primary" | "secondary" | "accent" | "neutral";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

export function Badge({ children, tone = "primary", className }: BadgeProps) {
  return <span className={cx(styles.badge, styles[tone], className)}>{children}</span>;
}

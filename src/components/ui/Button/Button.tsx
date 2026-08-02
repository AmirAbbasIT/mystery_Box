import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils";
import styles from "./Button.module.scss";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonOwnProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
  href?: string;
  external?: boolean;
}

export type ButtonProps = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps>;

export function Button({
  variant = "primary",
  size = "md",
  children,
  className,
  href,
  external,
  ...rest
}: ButtonProps) {
  const classes = cx(styles.button, styles[variant], styles[size], className);

  if (href) {
    if (external) {
      return (
        <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

import { cx, formatPrice } from "@/lib/utils";
import styles from "./PriceTag.module.scss";

interface PriceTagProps {
  price: number;
  from?: boolean;
  className?: string;
}

export function PriceTag({ price, from, className }: PriceTagProps) {
  return (
    <span className={cx(styles.price, className)}>
      {from && <span className={styles.from}>From </span>}
      {formatPrice(price)}
    </span>
  );
}

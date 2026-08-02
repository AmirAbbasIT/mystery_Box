import Image from "next/image";
import { PriceTag } from "@/components/product";
import type { BirthdayPackage } from "@/types";
import styles from "./PackageCard.module.scss";

interface PackageCardProps {
  pkg: BirthdayPackage;
}

export function PackageCard({ pkg }: PackageCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={pkg.image}
          alt=""
          fill
          sizes="(max-width: 600px) 90vw, 360px"
          className={styles.image}
        />
      </div>
      <div className={styles.body}>
        <h3>{pkg.name}</h3>
        <p className={styles.description}>{pkg.description}</p>
        <ul role="list" className={styles.includes}>
          {pkg.includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className={styles.footer}>
          {pkg.ageRange && <span className={styles.ageRange}>Ages {pkg.ageRange}</span>}
          <PriceTag price={pkg.priceFrom} from />
        </div>
      </div>
    </article>
  );
}

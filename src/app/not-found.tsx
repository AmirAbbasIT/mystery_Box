import Image from "next/image";
import { Button } from "@/components/ui";
import styles from "./not-found.module.scss";

export default function NotFound() {
  return (
    <div className={styles.page}>
      <Image
        src="/images/products/egg.svg"
        alt=""
        width={140}
        height={140}
        className={styles.image}
      />
      <h1>This box wasn&rsquo;t in the pool.</h1>
      <p>The page you&rsquo;re looking for doesn&rsquo;t exist — but there&rsquo;s plenty more to unbox.</p>
      <Button href="/">Back to Home</Button>
    </div>
  );
}

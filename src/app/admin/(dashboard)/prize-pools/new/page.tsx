import { createPrizePoolAction } from "../actions";
import { PrizePoolForm } from "../PrizePoolForm";
import styles from "../prize-pools.module.scss";

export default function NewPrizePoolPage() {
  return (
    <div>
      <h1 className={styles.title}>New prize pool</h1>
      <PrizePoolForm action={createPrizePoolAction} submitLabel="Create prize pool" />
    </div>
  );
}

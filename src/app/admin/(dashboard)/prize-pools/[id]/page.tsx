import { notFound } from "next/navigation";
import { getPrizePool } from "@/admin/services/prize-pools.service";
import { updatePrizePoolAction } from "../actions";
import { PrizePoolForm } from "../PrizePoolForm";
import styles from "../prize-pools.module.scss";

export default async function EditPrizePoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prizePool = await getPrizePool(id);

  if (!prizePool) notFound();

  return (
    <div>
      <h1 className={styles.title}>Edit prize pool</h1>
      <PrizePoolForm
        prizePool={prizePool}
        action={updatePrizePoolAction.bind(null, id)}
        submitLabel="Save changes"
      />
    </div>
  );
}

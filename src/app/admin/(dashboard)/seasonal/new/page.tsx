import { listProductOptions } from "@/admin/services/seasonal-collections.service";
import { createSeasonalCollectionAction } from "../actions";
import { SeasonalCollectionForm } from "../SeasonalCollectionForm";
import styles from "../seasonal.module.scss";

export default async function NewSeasonalCollectionPage() {
  const products = await listProductOptions();

  return (
    <div>
      <h1 className={styles.title}>New seasonal collection</h1>
      <SeasonalCollectionForm
        products={products}
        action={createSeasonalCollectionAction}
        submitLabel="Create collection"
      />
    </div>
  );
}

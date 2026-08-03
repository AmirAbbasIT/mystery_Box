import { notFound } from "next/navigation";
import {
  getSeasonalCollection,
  listProductOptions,
} from "@/admin/services/seasonal-collections.service";
import { updateSeasonalCollectionAction } from "../actions";
import { SeasonalCollectionForm } from "../SeasonalCollectionForm";
import styles from "../seasonal.module.scss";

export default async function EditSeasonalCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [collection, products] = await Promise.all([
    getSeasonalCollection(id),
    listProductOptions(),
  ]);

  if (!collection) notFound();

  return (
    <div>
      <h1 className={styles.title}>Edit seasonal collection</h1>
      <SeasonalCollectionForm
        collection={collection}
        products={products}
        action={updateSeasonalCollectionAction.bind(null, id)}
        submitLabel="Save changes"
      />
    </div>
  );
}

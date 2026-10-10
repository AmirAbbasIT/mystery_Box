import { listProductOptions } from "@/admin/services/reviews.service";
import { createReviewAction } from "../actions";
import { ReviewForm } from "../ReviewForm";
import styles from "../reviews.module.scss";

export default async function NewReviewPage() {
  const products = await listProductOptions();
  return (
    <div>
      <h1 className={styles.title}>New review</h1>
      <ReviewForm
        products={products}
        action={createReviewAction}
        submitLabel="Save review"
      />
    </div>
  );
}

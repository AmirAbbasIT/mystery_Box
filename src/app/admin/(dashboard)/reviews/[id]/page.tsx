import { notFound } from "next/navigation";
import { getReview, listProductOptions } from "@/admin/services/reviews.service";
import { updateReviewAction } from "../actions";
import { ReviewForm } from "../ReviewForm";
import styles from "../reviews.module.scss";

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [review, products] = await Promise.all([getReview(id), listProductOptions()]);
  if (!review) notFound();

  return (
    <div>
      <h1 className={styles.title}>Edit review</h1>
      <ReviewForm
        review={review}
        products={products}
        action={updateReviewAction.bind(null, id)}
        submitLabel="Save changes"
      />
    </div>
  );
}

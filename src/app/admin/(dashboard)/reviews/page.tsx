import Link from "next/link";
import { listReviews, type ReviewRecord } from "@/admin/services/reviews.service";
import { PLACEHOLDER_SOURCE, reviewSourceLabel } from "@/lib/reviews";
import { deleteReviewAction } from "./actions";
import styles from "./reviews.module.scss";

function status(review: ReviewRecord): { label: string; tone: string } {
  if (review.source === PLACEHOLDER_SOURCE) return { label: "Placeholder", tone: "off" };
  if (review.featured) return { label: "Featured", tone: "active" };
  if (review.published) return { label: "Published", tone: "scheduled" };
  return { label: "Draft", tone: "off" };
}

export default async function AdminReviewsPage() {
  const reviews = await listReviews();

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Reviews</h1>
        <Link href="/admin/reviews/new" className={styles.newLink}>
          + New review
        </Link>
      </div>
      <p className={styles.hint}>
        Featured reviews appear on the home page; published reviews linked to a product
        appear in its &ldquo;Peek inside&rdquo; window. Placeholders are examples and are
        never shown.
      </p>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Review</th>
            <th>Rating</th>
            <th>Product</th>
            <th>Status</th>
            <th>Source</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => {
            const { label, tone } = status(review);
            return (
              <tr key={review.id}>
                <td>
                  <strong>
                    {review.authorName}
                    {review.location ? `, ${review.location}` : ""}
                  </strong>
                  <div className={styles.quote}>&ldquo;{review.body}&rdquo;</div>
                </td>
                <td className={styles.stars}>{"★".repeat(review.rating)}</td>
                <td>
                  {review.productName ?? "—"}
                  {review.orderNumber && (
                    <div className={styles.muted}>{review.orderNumber}</div>
                  )}
                </td>
                <td>
                  <span className={styles.statusBadge} data-status={tone}>
                    {label}
                  </span>
                </td>
                <td className={styles.muted}>{reviewSourceLabel(review.source)}</td>
                <td className={styles.actions}>
                  <Link href={`/admin/reviews/${review.id}`}>Edit</Link>
                  <form action={deleteReviewAction.bind(null, review.id)}>
                    <button type="submit" className={styles.deleteButton}>
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
          {reviews.length === 0 && (
            <tr>
              <td colSpan={6}>No reviews yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

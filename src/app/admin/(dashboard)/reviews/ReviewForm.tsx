"use client";

import { useActionState, useState } from "react";
import type { ReviewRecord } from "@/admin/services/reviews.service";
import {
  PLACEHOLDER_SOURCE,
  REVIEW_SOURCES,
  publishBlocker,
  reviewSourceLabel,
} from "@/lib/reviews";
import type { ReviewFormState } from "./actions";
import styles from "./reviews.module.scss";

interface ReviewFormProps {
  review?: ReviewRecord;
  products: Array<{ id: string; name: string }>;
  action: (state: ReviewFormState, formData: FormData) => Promise<ReviewFormState>;
  submitLabel: string;
}

export function ReviewForm({ review, products, action, submitLabel }: ReviewFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [source, setSource] = useState(review?.source ?? "email");
  const [consentConfirmed, setConsentConfirmed] = useState(
    review?.consentConfirmed ?? false,
  );
  const [published, setPublished] = useState(review?.published ?? false);
  const [featured, setFeatured] = useState(review?.featured ?? false);
  const [rating, setRating] = useState(review?.rating ?? 5);

  const blocker = publishBlocker({ source, consentConfirmed });
  const canPublish = blocker === null;
  const isPublished = published && canPublish;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor="authorName">Customer name</label>
          <input
            id="authorName"
            name="authorName"
            defaultValue={review?.authorName}
            placeholder="e.g. Chloe or Chloe S."
            maxLength={60}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="location">Town / city — optional</label>
          <input
            id="location"
            name="location"
            defaultValue={review?.location ?? ""}
            placeholder="e.g. Manchester"
            maxLength={60}
          />
        </div>
      </div>

      <fieldset className={styles.fieldset}>
        <legend>Rating</legend>
        {[5, 4, 3, 2, 1].map((stars) => (
          <label key={stars} className={styles.radioLabel}>
            <input
              type="radio"
              name="rating"
              value={stars}
              checked={rating === stars}
              onChange={() => setRating(stars)}
            />
            {"★".repeat(stars)}
          </label>
        ))}
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="body">Review (their words — don&rsquo;t edit the meaning)</label>
        <textarea
          id="body"
          name="body"
          defaultValue={review?.body}
          rows={4}
          maxLength={1000}
          required
        />
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor="productId">Product — optional</label>
          <select id="productId" name="productId" defaultValue={review?.productId ?? ""}>
            <option value="">General (not about one product)</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="orderNumber">Order number — optional</label>
          <input
            id="orderNumber"
            name="orderNumber"
            defaultValue={review?.orderNumber ?? ""}
            placeholder="MPG-7K3Q9X"
            maxLength={20}
          />
          <p className={styles.hint}>
            Links their order → shows &ldquo;Verified purchase&rdquo;.
          </p>
        </div>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor="source">Where did this review come from?</label>
          <select
            id="source"
            name="source"
            value={source}
            onChange={(event) => setSource(event.target.value)}
          >
            {REVIEW_SOURCES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
            {source === PLACEHOLDER_SOURCE && (
              <option value={PLACEHOLDER_SOURCE}>
                {reviewSourceLabel(PLACEHOLDER_SOURCE)}
              </option>
            )}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="reviewedOn">Date received</label>
          <input
            id="reviewedOn"
            name="reviewedOn"
            type="date"
            defaultValue={review?.reviewedOn ?? today}
            max={today}
            required
          />
        </div>
      </div>

      <label className={styles.radioLabel}>
        <input
          type="checkbox"
          name="consentConfirmed"
          checked={consentConfirmed}
          onChange={(event) => setConsentConfirmed(event.target.checked)}
        />
        The customer agreed to this review being shown on the website
      </label>

      <label className={styles.radioLabel}>
        <input
          type="checkbox"
          name="published"
          checked={isPublished}
          disabled={!canPublish}
          onChange={(event) => {
            setPublished(event.target.checked);
            if (!event.target.checked) setFeatured(false);
          }}
        />
        Published (shown on the product)
      </label>
      {blocker && <p className={styles.hint}>{blocker}</p>}

      <label className={styles.radioLabel}>
        <input
          type="checkbox"
          name="featured"
          checked={featured && isPublished}
          disabled={!isPublished}
          onChange={(event) => setFeatured(event.target.checked)}
        />
        Featured on the home page
      </label>

      <p className={styles.hint}>
        UK law bans fake or made-up reviews. Only add reviews customers actually gave you,
        in their words.
      </p>

      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

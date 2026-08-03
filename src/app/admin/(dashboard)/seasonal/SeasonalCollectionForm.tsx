"use client";

import { useActionState, useState } from "react";
import type { ProductOption, SeasonalCollectionRecord } from "@/admin/services/seasonal-collections.service";
import { ImagePicker, type ImagePickerValue } from "@/admin/components/ImagePicker/ImagePicker";
import { uploadImageAction } from "../upload-image-action";
import type { SeasonalCollectionFormState } from "./actions";
import styles from "./seasonal.module.scss";

const uploadSeasonalImage = uploadImageAction.bind(null, "seasonal");

interface SeasonalCollectionFormProps {
  products: ProductOption[];
  collection?: SeasonalCollectionRecord;
  action: (
    state: SeasonalCollectionFormState,
    formData: FormData,
  ) => Promise<SeasonalCollectionFormState>;
  submitLabel: string;
}

export function SeasonalCollectionForm({
  products,
  collection,
  action,
  submitLabel,
}: SeasonalCollectionFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [heroImage, setHeroImage] = useState<ImagePickerValue[]>(
    collection?.heroImage ? [{ src: collection.heroImage, alt: "" }] : [],
  );
  const [productIds, setProductIds] = useState<string[]>(collection?.productIds ?? []);

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" defaultValue={collection?.name} required />
      </div>

      <div className={styles.field}>
        <label htmlFor="slug">Slug</label>
        <input id="slug" name="slug" defaultValue={collection?.slug} required />
      </div>

      <div className={styles.field}>
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" defaultValue={collection?.description} rows={3} />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="startsAt">Starts</label>
          <input
            id="startsAt"
            name="startsAt"
            type="date"
            defaultValue={collection?.startsAt}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="endsAt">Ends</label>
          <input id="endsAt" name="endsAt" type="date" defaultValue={collection?.endsAt} required />
        </div>
      </div>

      <fieldset className={styles.fieldset}>
        <legend>Products in this collection</legend>
        {products.map((product) => (
          <label key={product.id} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="productIds"
              value={product.id}
              checked={productIds.includes(product.id)}
              onChange={(e) =>
                setProductIds((current) =>
                  e.target.checked
                    ? [...current, product.id]
                    : current.filter((id) => id !== product.id),
                )
              }
            />
            {product.name}
          </label>
        ))}
        {products.length === 0 && <p>No products yet.</p>}
      </fieldset>

      <div className={styles.field}>
        <label>Hero image</label>
        <ImagePicker
          images={heroImage}
          onChange={setHeroImage}
          uploadAction={uploadSeasonalImage}
          showAlt={false}
        />
        <input type="hidden" name="heroImage" value={heroImage[0]?.src ?? ""} readOnly />
      </div>

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

"use client";

import { useActionState, useState } from "react";
import type { CategoryRecord } from "@/admin/services/categories.service";
import { ImagePicker, type ImagePickerValue } from "@/admin/components/ImagePicker/ImagePicker";
import { uploadImageAction } from "../upload-image-action";
import type { CategoryFormState } from "./actions";
import styles from "./categories.module.scss";

const uploadCategoryImage = uploadImageAction.bind(null, "categories");

interface CategoryFormProps {
  category?: CategoryRecord;
  action: (state: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;
  submitLabel: string;
}

export function CategoryForm({ category, action, submitLabel }: CategoryFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [heroImage, setHeroImage] = useState<ImagePickerValue[]>(
    category?.heroImage ? [{ src: category.heroImage, alt: "" }] : [],
  );

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" defaultValue={category?.name} required />
      </div>

      <div className={styles.field}>
        <label htmlFor="slug">Slug</label>
        <input id="slug" name="slug" defaultValue={category?.slug} required />
      </div>

      <div className={styles.field}>
        <label htmlFor="tagline">Tagline</label>
        <input id="tagline" name="tagline" defaultValue={category?.tagline} required />
      </div>

      <div className={styles.field}>
        <label>Hero image</label>
        <ImagePicker
          images={heroImage}
          onChange={setHeroImage}
          uploadAction={uploadCategoryImage}
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

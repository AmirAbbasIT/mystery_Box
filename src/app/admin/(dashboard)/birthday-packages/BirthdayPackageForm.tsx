"use client";

import { useActionState, useState } from "react";
import type { ThemeOption } from "@/admin/services/products.service";
import type { BirthdayPackageRecord } from "@/admin/services/birthday-packages.service";
import { ImagePicker, type ImagePickerValue } from "@/admin/components/ImagePicker/ImagePicker";
import { uploadImageAction } from "../upload-image-action";
import type { BirthdayPackageFormState } from "./actions";
import styles from "./birthday-packages.module.scss";

const uploadBirthdayPackageImage = uploadImageAction.bind(null, "birthday-packages");

interface BirthdayPackageFormProps {
  themes: ThemeOption[];
  pkg?: BirthdayPackageRecord;
  action: (state: BirthdayPackageFormState, formData: FormData) => Promise<BirthdayPackageFormState>;
  submitLabel: string;
}

export function BirthdayPackageForm({ themes, pkg, action, submitLabel }: BirthdayPackageFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [image, setImage] = useState<ImagePickerValue[]>(
    pkg?.image ? [{ src: pkg.image, alt: "" }] : [],
  );
  const [themeIds, setThemeIds] = useState<string[]>(pkg?.themeIds ?? []);

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" defaultValue={pkg?.name} required />
      </div>

      <div className={styles.field}>
        <label htmlFor="slug">Slug</label>
        <input id="slug" name="slug" defaultValue={pkg?.slug} required />
      </div>

      <div className={styles.field}>
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" defaultValue={pkg?.description} rows={3} />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="audience">Audience</label>
          <select id="audience" name="audience" defaultValue={pkg?.audience ?? "kids"}>
            <option value="kids">Kids</option>
            <option value="adult-party">Adult Party</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="priceFrom">Price from (£)</label>
          <input
            id="priceFrom"
            name="priceFrom"
            type="number"
            step="0.01"
            min="0"
            defaultValue={pkg ? (pkg.priceFromPence / 100).toFixed(2) : ""}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="ageRange">Age range (optional)</label>
          <input
            id="ageRange"
            name="ageRange"
            placeholder="e.g. 4-12"
            defaultValue={pkg?.ageRange ?? ""}
          />
        </div>
      </div>

      <fieldset className={styles.fieldset}>
        <legend>Themes</legend>
        {themes.map((theme) => (
          <label key={theme.id} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="themeIds"
              value={theme.id}
              checked={themeIds.includes(theme.id)}
              onChange={(e) =>
                setThemeIds((current) =>
                  e.target.checked
                    ? [...current, theme.id]
                    : current.filter((id) => id !== theme.id),
                )
              }
            />
            {theme.name}
          </label>
        ))}
        {themes.length === 0 && <p>No themes yet.</p>}
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="includes">What&rsquo;s included (one per line)</label>
        <textarea
          id="includes"
          name="includes"
          defaultValue={pkg?.includes.join("\n")}
          rows={4}
        />
      </div>

      <div className={styles.field}>
        <label>Image</label>
        <ImagePicker
          images={image}
          onChange={setImage}
          uploadAction={uploadBirthdayPackageImage}
          showAlt={false}
        />
        <input type="hidden" name="image" value={image[0]?.src ?? ""} readOnly />
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

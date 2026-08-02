"use client";

import { useActionState, useState } from "react";
import type { CategoryOption, ThemeOption, ProductRecord } from "@/admin/services/products.service";
import { ImagePicker, type ImagePickerValue } from "@/admin/components/ImagePicker/ImagePicker";
import { uploadImageAction } from "../upload-image-action";
import type { ProductFormState } from "./actions";
import { ProductPreview } from "./ProductPreview";
import styles from "./products.module.scss";

const AGE_OPTIONS = ["kids", "teens", "adults", "all-ages"];
const uploadProductImage = uploadImageAction.bind(null, "products");

interface ProductFormProps {
  categories: CategoryOption[];
  themes: ThemeOption[];
  product?: ProductRecord;
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  submitLabel: string;
}

function serializeImages(images: ImagePickerValue[]): string {
  return images.map((image) => `${image.src} | ${image.alt}`).join("\n");
}

function parseLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function ProductForm({ categories, themes, product, action, submitLabel }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  // Controlled only for fields the live preview needs — everything else stays uncontrolled
  // (defaultValue) since it doesn't affect what's rendered on the right.
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [priceInput, setPriceInput] = useState(
    product ? (product.pricePence / 100).toFixed(2) : "",
  );
  const [images, setImages] = useState<ImagePickerValue[]>(product?.images ?? []);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [themeIds, setThemeIds] = useState<string[]>(product?.themeIds ?? []);
  const [whatCouldBeInsideInput, setWhatCouldBeInsideInput] = useState(
    product?.whatCouldBeInside.join("\n") ?? "",
  );

  const pricePence = Math.round((Number(priceInput) || 0) * 100);
  const selectedThemes = themes.filter((theme) => themeIds.includes(theme.id));

  return (
    <div className={styles.formLayout}>
      <form action={formAction} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className={styles.field}>
          <label htmlFor="slug">Slug</label>
          <input id="slug" name="slug" defaultValue={product?.slug} required />
        </div>

        <div className={styles.field}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="price">Price (£)</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="stock">Stock</label>
            <input id="stock" name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="categoryId">Category</label>
          <select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""} required>
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <fieldset className={styles.fieldset}>
          <legend>Age suitability</legend>
          {AGE_OPTIONS.map((age) => (
            <label key={age} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="ageSuitability"
                value={age}
                defaultChecked={product?.ageSuitability.includes(age)}
              />
              {age}
            </label>
          ))}
        </fieldset>

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
          <label htmlFor="whatCouldBeInside">What could be inside (one per line)</label>
          <textarea
            id="whatCouldBeInside"
            name="whatCouldBeInside"
            value={whatCouldBeInsideInput}
            onChange={(e) => setWhatCouldBeInsideInput(e.target.value)}
            rows={4}
          />
        </div>

        <div className={styles.field}>
          <label>Images</label>
          <ImagePicker images={images} onChange={setImages} uploadAction={uploadProductImage} multiple />
          <input type="hidden" name="images" value={serializeImages(images)} readOnly />
        </div>

        <div className={styles.row}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="active" defaultChecked={product?.active ?? true} />
            Active
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="featured"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Featured
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="seasonal" defaultChecked={product?.seasonal} />
            Seasonal
          </label>
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

      <ProductPreview
        name={name}
        description={description}
        pricePence={pricePence}
        featured={featured}
        image={images[0]}
        themes={selectedThemes}
        whatCouldBeInside={parseLines(whatCouldBeInsideInput)}
      />
    </div>
  );
}

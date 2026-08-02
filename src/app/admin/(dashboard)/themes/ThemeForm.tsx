"use client";

import { useActionState, useState } from "react";
import type { ThemeRecord } from "@/admin/services/themes.service";
import type { ThemeFormState } from "./actions";
import styles from "./themes.module.scss";

interface ThemeFormProps {
  theme?: ThemeRecord;
  action: (state: ThemeFormState, formData: FormData) => Promise<ThemeFormState>;
  submitLabel: string;
}

const DEFAULT_SWATCH = "#ff6fa5";

export function ThemeForm({ theme, action, submitLabel }: ThemeFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  const [name, setName] = useState(theme?.name ?? "");
  const [description, setDescription] = useState(theme?.description ?? "");
  const [colorSwatch, setColorSwatch] = useState(theme?.colorSwatch ?? DEFAULT_SWATCH);

  const isValidHex = /^#[0-9a-fA-F]{3,8}$/.test(colorSwatch);

  return (
    <div className={styles.formLayout}>
      <form action={formAction} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className={styles.field}>
          <label htmlFor="slug">Slug</label>
          <input id="slug" name="slug" defaultValue={theme?.slug} required />
        </div>

        <div className={styles.field}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="colorSwatch">Colour swatch</label>
          <div className={styles.swatchRow}>
            <input
              id="colorSwatchPicker"
              type="color"
              className={styles.swatchPicker}
              value={isValidHex ? colorSwatch : DEFAULT_SWATCH}
              onChange={(e) => setColorSwatch(e.target.value)}
              aria-label="Pick colour swatch"
            />
            <input
              id="colorSwatch"
              name="colorSwatch"
              value={colorSwatch}
              onChange={(e) => setColorSwatch(e.target.value)}
              placeholder="#ff6fa5"
              required
            />
          </div>
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

      <aside className={styles.previewPanel}>
        <p className={styles.previewHeading}>Live preview</p>
        <div className={styles.previewCard}>
          <span
            className={styles.previewDot}
            style={{ backgroundColor: isValidHex ? colorSwatch : "transparent" }}
          />
          <div>
            <p className={styles.previewName}>{name || "Theme name"}</p>
            <p className={styles.previewDescription}>{description || "Theme description…"}</p>
          </div>
        </div>
        <div className={styles.previewChipRow}>
          <span
            className={styles.previewChip}
            style={{ backgroundColor: isValidHex ? colorSwatch : "var(--color-surface-alt)" }}
          >
            {name || "Theme name"}
          </span>
        </div>
      </aside>
    </div>
  );
}

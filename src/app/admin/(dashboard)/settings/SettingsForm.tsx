"use client";

import { useActionState, useState } from "react";
import { Button, Badge } from "@/components/ui";
import { PriceTag } from "@/components/product";
import { cx } from "@/lib/utils";
import { COLOR_PALETTES } from "@/lib/color-palettes";
import type { SettingsFormState } from "./actions";
import styles from "./settings.module.scss";

interface SettingsFormProps {
  currentPaletteId: string;
  action: (state: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
}

export function SettingsForm({ currentPaletteId, action }: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [selectedId, setSelectedId] = useState(currentPaletteId);
  const selectedPalette = COLOR_PALETTES.find((palette) => palette.id === selectedId);

  return (
    <div className={styles.layout}>
      <form action={formAction} className={styles.form}>
        <h2 className={styles.sectionTitle}>Colour palette</h2>
        <p className={styles.sectionDescription}>
          Choose which palette is live on the storefront. Changes apply immediately across the
          whole site — no redeploy needed.
        </p>

        <div className={styles.swatchGrid} role="radiogroup" aria-label="Colour palette">
          {COLOR_PALETTES.map((palette) => (
            <label
              key={palette.id}
              className={cx(styles.swatchCard, selectedId === palette.id && styles.swatchCardActive)}
            >
              <input
                type="radio"
                name="paletteId"
                value={palette.id}
                checked={selectedId === palette.id}
                onChange={() => setSelectedId(palette.id)}
                className={styles.swatchRadio}
              />
              <div className={styles.swatchDots}>
                <span style={{ backgroundColor: palette.swatch.primary }} />
                <span style={{ backgroundColor: palette.swatch.secondary }} />
                <span style={{ backgroundColor: palette.swatch.accent }} />
              </div>
              <p className={styles.swatchName}>
                {palette.name} {palette.id === currentPaletteId && <Badge tone="accent">Live</Badge>}
              </p>
              <p className={styles.swatchDescription}>{palette.description}</p>
            </label>
          ))}
        </div>

        {state.error && (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || selectedId === currentPaletteId}
          className={styles.submit}
        >
          {pending ? "Applying…" : "Apply palette"}
        </button>
      </form>

      <aside data-color-theme={selectedId} className={styles.previewPanel}>
        <p className={styles.previewLabel}>Live preview — {selectedPalette?.name}</p>
        <div className={styles.previewCard}>
          <div className={styles.previewBadgeRow}>
            <Badge tone="primary">New</Badge>
            <Badge tone="secondary">Kawaii Pastels</Badge>
            <Badge tone="accent">Bestseller</Badge>
          </div>
          <h3 className={styles.previewTitle}>Jewellery Mystery Box</h3>
          <p className={styles.previewDescription}>A hand-picked edit in soft, cute-core styles.</p>
          <div className={styles.previewFooter}>
            <PriceTag price={10} />
            <Button size="sm">Peek inside</Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { ImagePicker, type ImagePickerValue } from "@/admin/components/ImagePicker/ImagePicker";
import { uploadImageAction } from "../upload-image-action";
import type { PrizePoolRecord, PrizePoolKind, PrizeRarity } from "@/admin/services/prize-pools.service";
import { WheelSpinLoader } from "@/components/animations";
import type { PrizeItem } from "@/types";
import type { PrizePoolFormState } from "./actions";
import styles from "./prize-pools.module.scss";

const uploadPrizePoolImage = uploadImageAction.bind(null, "prize-pools");
const RARITY_OPTIONS: PrizeRarity[] = ["common", "uncommon", "rare", "jackpot"];

interface EditablePrizeItem {
  key: string;
  label: string;
  rarity: PrizeRarity;
  weight: string;
}

function toEditable(items: PrizePoolRecord["prizeItems"]): EditablePrizeItem[] {
  return items.map((item, index) => ({
    key: `existing-${index}`,
    label: item.label,
    rarity: item.rarity,
    weight: String(item.weight),
  }));
}

interface PrizePoolFormProps {
  prizePool?: PrizePoolRecord;
  action: (state: PrizePoolFormState, formData: FormData) => Promise<PrizePoolFormState>;
  submitLabel: string;
}

export function PrizePoolForm({ prizePool, action, submitLabel }: PrizePoolFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  const [kind, setKind] = useState<PrizePoolKind>(prizePool?.kind ?? "wheel");
  const [image, setImage] = useState<ImagePickerValue[]>(
    prizePool?.image ? [{ src: prizePool.image, alt: "" }] : [],
  );
  const [prizeItems, setPrizeItems] = useState<EditablePrizeItem[]>(
    prizePool ? toEditable(prizePool.prizeItems) : [],
  );

  const totalWeight = prizeItems.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);

  function addPrizeItem() {
    setPrizeItems((current) => [
      ...current,
      { key: crypto.randomUUID(), label: "", rarity: "common", weight: "10" },
    ]);
  }

  function updatePrizeItem(key: string, patch: Partial<EditablePrizeItem>) {
    setPrizeItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function removePrizeItem(key: string) {
    setPrizeItems((current) => current.filter((item) => item.key !== key));
  }

  function moveItem(index: number, direction: -1 | 1) {
    setPrizeItems((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const previewPrizes: PrizeItem[] = prizeItems.map((item) => ({
    id: item.key,
    label: item.label || "Untitled prize",
    rarity: item.rarity,
    weight: Number(item.weight) || 0,
  }));

  const serializedPrizeItems = JSON.stringify(
    prizeItems.map((item) => ({ label: item.label, rarity: item.rarity, weight: Number(item.weight) || 0 })),
  );

  return (
    <div className={styles.formLayout}>
      <form action={formAction} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" defaultValue={prizePool?.name} required />
        </div>

        <div className={styles.field}>
          <label htmlFor="slug">Slug</label>
          <input id="slug" name="slug" defaultValue={prizePool?.slug} required />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="kind">Kind</label>
            <select
              id="kind"
              name="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as PrizePoolKind)}
            >
              <option value="wheel">Wheel Spin</option>
              <option value="egg">Mystery Egg</option>
            </select>
          </div>

          {kind === "egg" && (
            <div className={styles.field}>
              <label htmlFor="quantity">Quantity (eggs in this tier)</label>
              <input id="quantity" name="quantity" type="number" min="1" defaultValue={prizePool?.quantity ?? 1} />
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="price">Price (£)</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={prizePool ? (prizePool.pricePence / 100).toFixed(2) : undefined}
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label>Image</label>
          <ImagePicker images={image} onChange={setImage} uploadAction={uploadPrizePoolImage} showAlt={false} />
          <input type="hidden" name="image" value={image[0]?.src ?? ""} readOnly />
        </div>

        <fieldset className={styles.fieldset}>
          <legend>
            Prizes {prizeItems.length > 0 && `(${totalWeight} total weight)`}
          </legend>

          <div className={styles.prizeRows}>
            {prizeItems.map((item, index) => (
              <div key={item.key} className={styles.prizeRow}>
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updatePrizeItem(item.key, { label: e.target.value })}
                  placeholder="Prize label"
                  className={styles.prizeLabelInput}
                  aria-label={`Prize ${index + 1} label`}
                />
                <select
                  value={item.rarity}
                  onChange={(e) => updatePrizeItem(item.key, { rarity: e.target.value as PrizeRarity })}
                  aria-label={`Prize ${index + 1} rarity`}
                >
                  {RARITY_OPTIONS.map((rarity) => (
                    <option key={rarity} value={rarity}>
                      {rarity}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.weight}
                  onChange={(e) => updatePrizeItem(item.key, { weight: e.target.value })}
                  className={styles.prizeWeightInput}
                  aria-label={`Prize ${index + 1} weight`}
                />
                <span className={styles.prizeOdds}>
                  {totalWeight > 0 ? `${((Number(item.weight) / totalWeight) * 100).toFixed(0)}%` : "—"}
                </span>
                <button
                  type="button"
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move prize ${index + 1} up`}
                  className={styles.moveButton}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, 1)}
                  disabled={index === prizeItems.length - 1}
                  aria-label={`Move prize ${index + 1} down`}
                  className={styles.moveButton}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removePrizeItem(item.key)}
                  className={styles.removeButton}
                  aria-label={`Remove prize ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addPrizeItem} className={styles.addPrizeButton}>
            + Add prize
          </button>
          <input type="hidden" name="prizeItems" value={serializedPrizeItems} readOnly />
        </fieldset>

        {state.error && (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </form>

      {kind === "wheel" && previewPrizes.length > 0 && (
        <aside className={styles.previewPanel}>
          <p className={styles.previewHeading}>Live preview</p>
          <WheelSpinLoader prizes={previewPrizes} />
        </aside>
      )}
    </div>
  );
}

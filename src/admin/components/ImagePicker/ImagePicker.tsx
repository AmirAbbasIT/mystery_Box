"use client";

import { useRef, useState } from "react";
import styles from "./ImagePicker.module.scss";

export interface ImagePickerValue {
  src: string;
  alt: string;
}

interface ImagePickerProps {
  images: ImagePickerValue[];
  onChange: (images: ImagePickerValue[]) => void;
  uploadAction: (formData: FormData) => Promise<{ src?: string; error?: string }>;
  multiple?: boolean;
  showAlt?: boolean;
}

/**
 * Shared admin image upload widget — Products (multiple, with alt text) and Categories (single,
 * no alt) both use this. Uploads immediately on file selection via `uploadAction` (bound to a
 * folder in src/app/admin/(dashboard)/upload-image-action.ts), rather than waiting for the whole
 * form to submit, so the admin sees the result (or an upload error) right away.
 */
export function ImagePicker({
  images,
  onChange,
  uploadAction,
  multiple = false,
  showAlt = true,
}: ImagePickerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadAction(formData);

    setIsUploading(false);

    if (result.error || !result.src) {
      setError(result.error ?? "Upload failed.");
      return;
    }

    const newImage: ImagePickerValue = { src: result.src, alt: "" };
    onChange(multiple ? [...images, newImage] : [newImage]);
  }

  function updateAlt(index: number, alt: string) {
    onChange(images.map((image, i) => (i === index ? { ...image, alt } : image)));
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className={styles.picker}>
      <div className={styles.thumbnails}>
        {images.map((image, index) => (
          <div key={image.src} className={styles.thumbnail}>
            {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of an uploaded Storage URL, not a Next-optimized asset */}
            <img src={image.src} alt={image.alt} className={styles.thumbnailImage} />
            {showAlt && (
              <input
                type="text"
                value={image.alt}
                onChange={(e) => updateAlt(index, e.target.value)}
                placeholder="Alt text"
                className={styles.altInput}
                aria-label={`Alt text for image ${index + 1}`}
              />
            )}
            <button
              type="button"
              onClick={() => removeImage(index)}
              className={styles.removeButton}
              aria-label={`Remove image ${index + 1}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {(multiple || images.length === 0) && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={styles.addButton}
        >
          {isUploading ? "Uploading…" : "+ Add image"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        onChange={handleFileChange}
        className={styles.hiddenInput}
      />

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

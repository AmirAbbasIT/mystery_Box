"use server";

import { requireAdmin } from "@/admin/auth/dal";
import { uploadImage } from "@/admin/storage/upload";

export interface UploadImageResult {
  src?: string;
  error?: string;
}

/**
 * Shared upload action for every admin image picker (Products, Categories, ...). `folder` is
 * bound per-caller, e.g. `uploadImageAction.bind(null, "products")`. Called directly (not via
 * useActionState) since ImagePicker triggers one upload per file-select event, not a form submit.
 */
export async function uploadImageAction(
  folder: string,
  formData: FormData,
): Promise<UploadImageResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file selected." };
  }

  try {
    const { src } = await uploadImage(file, folder);
    return { src };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Upload failed." };
  }
}

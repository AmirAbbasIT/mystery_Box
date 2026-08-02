import "server-only";
import { getStorageClient } from "./client";

const BUCKET_NAME = "catalogue-images";

export interface UploadedImage {
  src: string;
}

/** `folder` scopes the storage path per entity (e.g. "products", "categories"). */
export async function uploadImage(file: File, folder: string): Promise<UploadedImage> {
  const supabase = getStorageClient();
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(`Failed to upload image: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return { src: data.publicUrl };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/admin/auth/dal";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  type ProductInput,
} from "@/admin/services/products.service";

export interface ProductFormState {
  error?: string;
}

function parseProductInput(formData: FormData): ProductInput {
  const pricePounds = Number(formData.get("price"));

  return {
    slug: String(formData.get("slug") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    pricePence: Number.isFinite(pricePounds) ? Math.round(pricePounds * 100) : 0,
    categoryId: String(formData.get("categoryId") ?? ""),
    stock: Number(formData.get("stock")) || 0,
    active: formData.get("active") === "on",
    featured: formData.get("featured") === "on",
    seasonal: formData.get("seasonal") === "on",
    ageSuitability: formData.getAll("ageSuitability").map(String),
    themeIds: formData.getAll("themeIds").map(String),
    whatCouldBeInside: String(formData.get("whatCouldBeInside") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    images: String(formData.get("images") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [src, alt] = line.split("|").map((part) => part.trim());
        return { src, alt: alt ?? "" };
      }),
  };
}

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const input = parseProductInput(formData);
  if (!input.slug || !input.name || !input.categoryId) {
    return { error: "Slug, name, and category are required." };
  }

  try {
    await createProduct(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to create product." };
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProductAction(
  id: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const input = parseProductInput(formData);
  if (!input.slug || !input.name || !input.categoryId) {
    return { error: "Slug, name, and category are required." };
  }

  try {
    await updateProduct(id, input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update product." };
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function deleteProductAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteProduct(id);
  revalidatePath("/admin/products");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/admin/auth/dal";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CategoryInput,
} from "@/admin/services/categories.service";
import { Prisma } from "@/generated/prisma/client";

export interface CategoryFormState {
  error?: string;
}

function parseCategoryInput(formData: FormData): CategoryInput {
  return {
    slug: String(formData.get("slug") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    tagline: String(formData.get("tagline") ?? "").trim(),
    heroImage: String(formData.get("heroImage") ?? "").trim(),
  };
}

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const input = parseCategoryInput(formData);
  if (!input.slug || !input.name || !input.heroImage) {
    return { error: "Slug, name, and a hero image are required." };
  }

  try {
    await createCategory(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to create category." };
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategoryAction(
  id: string,
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const input = parseCategoryInput(formData);
  if (!input.slug || !input.name || !input.heroImage) {
    return { error: "Slug, name, and a hero image are required." };
  }

  try {
    await updateCategory(id, input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update category." };
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategoryAction(id: string): Promise<void> {
  await requireAdmin();

  try {
    await deleteCategory(id);
  } catch (error) {
    const message =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003"
        ? "Cannot delete — this category still has products assigned to it."
        : "Failed to delete category.";
    redirect(`/admin/categories?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/categories");
}

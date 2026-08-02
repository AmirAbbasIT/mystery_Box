"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/admin/auth/dal";
import { createTheme, deleteTheme, updateTheme, type ThemeInput } from "@/admin/services/themes.service";

export interface ThemeFormState {
  error?: string;
}

function parseThemeInput(formData: FormData): ThemeInput {
  return {
    slug: String(formData.get("slug") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    colorSwatch: String(formData.get("colorSwatch") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
  };
}

export async function createThemeAction(
  _prevState: ThemeFormState,
  formData: FormData,
): Promise<ThemeFormState> {
  await requireAdmin();

  const input = parseThemeInput(formData);
  if (!input.slug || !input.name || !input.colorSwatch) {
    return { error: "Slug, name, and colour swatch are required." };
  }

  try {
    await createTheme(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to create theme." };
  }

  revalidatePath("/admin/themes");
  redirect("/admin/themes");
}

export async function updateThemeAction(
  id: string,
  _prevState: ThemeFormState,
  formData: FormData,
): Promise<ThemeFormState> {
  await requireAdmin();

  const input = parseThemeInput(formData);
  if (!input.slug || !input.name || !input.colorSwatch) {
    return { error: "Slug, name, and colour swatch are required." };
  }

  try {
    await updateTheme(id, input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update theme." };
  }

  revalidatePath("/admin/themes");
  redirect("/admin/themes");
}

export async function deleteThemeAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteTheme(id);
  revalidatePath("/admin/themes");
}

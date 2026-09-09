"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/admin/auth/dal";
import { createTheme, deleteTheme, updateTheme, type ThemeInput } from "@/admin/services/themes.service";
import { Prisma } from "@/generated/prisma/client";
import { slugify } from "@/lib/utils";

export interface ThemeFormState {
  error?: string;
}

function parseThemeInput(formData: FormData): ThemeInput {
  const name = String(formData.get("name") ?? "").trim();
  return {
    slug: slugify(name),
    name,
    colorSwatch: String(formData.get("colorSwatch") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
  };
}

function friendlyError(error: unknown, fallback: string): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "A theme with this name already exists — try a slightly different name.";
  }
  return error instanceof Error ? error.message : fallback;
}

export async function createThemeAction(
  _prevState: ThemeFormState,
  formData: FormData,
): Promise<ThemeFormState> {
  await requireAdmin();

  const input = parseThemeInput(formData);
  if (!input.slug || !input.name || !input.colorSwatch) {
    return { error: "Name and colour swatch are required." };
  }

  try {
    await createTheme(input);
  } catch (error) {
    return { error: friendlyError(error, "Failed to create theme.") };
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
    return { error: "Name and colour swatch are required." };
  }

  try {
    await updateTheme(id, input);
  } catch (error) {
    return { error: friendlyError(error, "Failed to update theme.") };
  }

  revalidatePath("/admin/themes");
  redirect("/admin/themes");
}

export async function deleteThemeAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteTheme(id);
  revalidatePath("/admin/themes");
}

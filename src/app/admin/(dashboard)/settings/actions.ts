"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/admin/auth/dal";
import { setActiveColorPalette } from "@/admin/services/site-settings.service";

export interface SettingsFormState {
  error?: string;
}

export async function updateColorPaletteAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdmin();

  const paletteId = String(formData.get("paletteId") ?? "");
  if (!paletteId) return { error: "Choose a palette first." };

  try {
    await setActiveColorPalette(paletteId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update palette." };
  }

  // Root-layout revalidation — the palette affects every page on the site, not just this one.
  revalidatePath("/", "layout");
  redirect("/admin/settings");
}

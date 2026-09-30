"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/admin/auth/dal";
import { setActiveColorPalette, setShippingSettings } from "@/admin/services/site-settings.service";

export interface SettingsFormState {
  error?: string;
  success?: string;
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

function parsePoundsToPence(raw: string): number | null {
  const match = /^(\d{1,5})(?:\.(\d{1,2}))?$/.exec(raw.trim().replace(/^£/, ""));
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0"));
}

export async function updateShippingAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdmin();

  const flatPence = parsePoundsToPence(String(formData.get("flatRate") ?? ""));
  if (flatPence === null) return { error: "Enter the shipping fee in pounds, e.g. 3.99 (0 for free)." };

  const thresholdRaw = String(formData.get("freeThreshold") ?? "").trim();
  const freeThresholdPence = thresholdRaw === "" ? null : parsePoundsToPence(thresholdRaw);
  if (thresholdRaw !== "" && freeThresholdPence === null) {
    return { error: "Enter the free-shipping threshold in pounds, e.g. 40, or leave it blank." };
  }

  await setShippingSettings({ flatPence, freeThresholdPence });

  revalidatePath("/basket");
  revalidatePath("/admin/settings");
  return { success: "Shipping settings saved." };
}

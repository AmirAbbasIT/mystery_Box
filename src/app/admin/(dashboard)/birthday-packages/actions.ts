"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/admin/auth/dal";
import {
  createBirthdayPackage,
  deleteBirthdayPackage,
  updateBirthdayPackage,
  type BirthdayAudience,
  type BirthdayPackageInput,
} from "@/admin/services/birthday-packages.service";

export interface BirthdayPackageFormState {
  error?: string;
}

function parseBirthdayPackageInput(formData: FormData): BirthdayPackageInput {
  const audience: BirthdayAudience =
    String(formData.get("audience") ?? "kids") === "adult-party" ? "adult-party" : "kids";
  const priceFromPounds = Number(formData.get("priceFrom"));
  const ageRange = String(formData.get("ageRange") ?? "").trim();

  return {
    slug: String(formData.get("slug") ?? "").trim(),
    audience,
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    priceFromPence: Number.isFinite(priceFromPounds) ? Math.round(priceFromPounds * 100) : 0,
    ageRange: ageRange || null,
    image: String(formData.get("image") ?? "").trim(),
    includes: String(formData.get("includes") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    themeIds: formData.getAll("themeIds").map(String),
  };
}

function validate(input: BirthdayPackageInput): string | null {
  if (!input.slug || !input.name || !input.image) {
    return "Slug, name, and an image are required.";
  }
  if (input.includes.length === 0) {
    return "Add at least one include line.";
  }
  return null;
}

export async function createBirthdayPackageAction(
  _prevState: BirthdayPackageFormState,
  formData: FormData,
): Promise<BirthdayPackageFormState> {
  await requireAdmin();

  const input = parseBirthdayPackageInput(formData);
  const error = validate(input);
  if (error) return { error };

  try {
    await createBirthdayPackage(input);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create birthday package." };
  }

  revalidatePath("/admin/birthday-packages");
  revalidatePath("/birthday-packages");
  redirect("/admin/birthday-packages");
}

export async function updateBirthdayPackageAction(
  id: string,
  _prevState: BirthdayPackageFormState,
  formData: FormData,
): Promise<BirthdayPackageFormState> {
  await requireAdmin();

  const input = parseBirthdayPackageInput(formData);
  const error = validate(input);
  if (error) return { error };

  try {
    await updateBirthdayPackage(id, input);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update birthday package." };
  }

  revalidatePath("/admin/birthday-packages");
  revalidatePath("/birthday-packages");
  redirect("/admin/birthday-packages");
}

export async function deleteBirthdayPackageAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteBirthdayPackage(id);
  revalidatePath("/admin/birthday-packages");
  revalidatePath("/birthday-packages");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/admin/auth/dal";
import {
  createSeasonalCollection,
  deleteSeasonalCollection,
  updateSeasonalCollection,
  type SeasonalCollectionInput,
} from "@/admin/services/seasonal-collections.service";

export interface SeasonalCollectionFormState {
  error?: string;
}

function parseSeasonalCollectionInput(formData: FormData): SeasonalCollectionInput {
  return {
    slug: String(formData.get("slug") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    startsAt: String(formData.get("startsAt") ?? "").trim(),
    endsAt: String(formData.get("endsAt") ?? "").trim(),
    heroImage: String(formData.get("heroImage") ?? "").trim(),
    productIds: formData.getAll("productIds").map(String),
  };
}

function validate(input: SeasonalCollectionInput): string | null {
  if (!input.slug || !input.name || !input.heroImage) {
    return "Slug, name, and a hero image are required.";
  }
  if (!input.startsAt || !input.endsAt) {
    return "Start and end dates are required.";
  }
  if (input.startsAt > input.endsAt) {
    return "Start date must be before the end date.";
  }
  return null;
}

export async function createSeasonalCollectionAction(
  _prevState: SeasonalCollectionFormState,
  formData: FormData,
): Promise<SeasonalCollectionFormState> {
  await requireAdmin();

  const input = parseSeasonalCollectionInput(formData);
  const error = validate(input);
  if (error) return { error };

  try {
    await createSeasonalCollection(input);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create collection." };
  }

  revalidatePath("/admin/seasonal");
  revalidatePath("/seasonal");
  redirect("/admin/seasonal");
}

export async function updateSeasonalCollectionAction(
  id: string,
  _prevState: SeasonalCollectionFormState,
  formData: FormData,
): Promise<SeasonalCollectionFormState> {
  await requireAdmin();

  const input = parseSeasonalCollectionInput(formData);
  const error = validate(input);
  if (error) return { error };

  try {
    await updateSeasonalCollection(id, input);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update collection." };
  }

  revalidatePath("/admin/seasonal");
  revalidatePath("/seasonal");
  redirect("/admin/seasonal");
}

export async function deleteSeasonalCollectionAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteSeasonalCollection(id);
  revalidatePath("/admin/seasonal");
  revalidatePath("/seasonal");
}

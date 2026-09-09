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
import { Prisma } from "@/generated/prisma/client";
import { slugify } from "@/lib/utils";

export interface SeasonalCollectionFormState {
  error?: string;
}

function parseSeasonalCollectionInput(formData: FormData): SeasonalCollectionInput {
  const name = String(formData.get("name") ?? "").trim();
  return {
    slug: slugify(name),
    name,
    description: String(formData.get("description") ?? "").trim(),
    startsAt: String(formData.get("startsAt") ?? "").trim(),
    endsAt: String(formData.get("endsAt") ?? "").trim(),
    heroImage: String(formData.get("heroImage") ?? "").trim(),
    productIds: formData.getAll("productIds").map(String),
  };
}

function validate(input: SeasonalCollectionInput): string | null {
  if (!input.slug || !input.name || !input.heroImage) {
    return "Name and a hero image are required.";
  }
  if (!input.startsAt || !input.endsAt) {
    return "Start and end dates are required.";
  }
  if (input.startsAt > input.endsAt) {
    return "Start date must be before the end date.";
  }
  return null;
}

function friendlyError(error: unknown, fallback: string): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "A seasonal collection with this name already exists — try a slightly different name.";
  }
  return error instanceof Error ? error.message : fallback;
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
    return { error: friendlyError(err, "Failed to create collection.") };
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
    return { error: friendlyError(err, "Failed to update collection.") };
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

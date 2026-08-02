"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/admin/auth/dal";
import {
  createPrizePool,
  deletePrizePool,
  updatePrizePool,
  type PrizePoolInput,
  type PrizeItemInput,
} from "@/admin/services/prize-pools.service";

export interface PrizePoolFormState {
  error?: string;
}

function parsePrizePoolInput(formData: FormData): PrizePoolInput {
  const kind = String(formData.get("kind") ?? "wheel") === "egg" ? "egg" : "wheel";
  const quantityRaw = formData.get("quantity");
  const pricePounds = Number(formData.get("price"));

  let prizeItems: PrizeItemInput[] = [];
  try {
    const raw = JSON.parse(String(formData.get("prizeItems") ?? "[]"));
    if (Array.isArray(raw)) {
      prizeItems = raw.map((item) => ({
        label: String(item.label ?? "").trim(),
        rarity: ["common", "uncommon", "rare", "jackpot"].includes(item.rarity)
          ? item.rarity
          : "common",
        weight: Number(item.weight) || 0,
      }));
    }
  } catch {
    prizeItems = [];
  }

  return {
    slug: String(formData.get("slug") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    kind,
    quantity: kind === "egg" && quantityRaw ? Number(quantityRaw) : null,
    pricePence: Number.isFinite(pricePounds) ? Math.round(pricePounds * 100) : 0,
    image: String(formData.get("image") ?? "").trim(),
    prizeItems,
  };
}

function validate(input: PrizePoolInput): string | null {
  if (!input.slug || !input.name || !input.image) {
    return "Slug, name, and an image are required.";
  }
  if (input.prizeItems.length === 0) {
    return "Add at least one prize.";
  }
  if (input.prizeItems.some((item) => !item.label || item.weight <= 0)) {
    return "Every prize needs a label and a weight greater than 0.";
  }
  return null;
}

export async function createPrizePoolAction(
  _prevState: PrizePoolFormState,
  formData: FormData,
): Promise<PrizePoolFormState> {
  await requireAdmin();

  const input = parsePrizePoolInput(formData);
  const error = validate(input);
  if (error) return { error };

  try {
    await createPrizePool(input);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create prize pool." };
  }

  revalidatePath("/admin/prize-pools");
  redirect("/admin/prize-pools");
}

export async function updatePrizePoolAction(
  id: string,
  _prevState: PrizePoolFormState,
  formData: FormData,
): Promise<PrizePoolFormState> {
  await requireAdmin();

  const input = parsePrizePoolInput(formData);
  const error = validate(input);
  if (error) return { error };

  try {
    await updatePrizePool(id, input);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update prize pool." };
  }

  revalidatePath("/admin/prize-pools");
  redirect("/admin/prize-pools");
}

export async function deletePrizePoolAction(id: string): Promise<void> {
  await requireAdmin();
  await deletePrizePool(id);
  revalidatePath("/admin/prize-pools");
}

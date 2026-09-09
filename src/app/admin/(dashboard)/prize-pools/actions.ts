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
import { Prisma } from "@/generated/prisma/client";
import { slugify } from "@/lib/utils";

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

  const name = String(formData.get("name") ?? "").trim();

  return {
    slug: slugify(name),
    name,
    kind,
    quantity: kind === "egg" && quantityRaw ? Number(quantityRaw) : null,
    pricePence: Number.isFinite(pricePounds) ? Math.round(pricePounds * 100) : 0,
    image: String(formData.get("image") ?? "").trim(),
    prizeItems,
  };
}

function validate(input: PrizePoolInput): string | null {
  if (!input.slug || !input.name || !input.image) {
    return "Name and an image are required.";
  }
  if (input.prizeItems.length === 0) {
    return "Add at least one prize.";
  }
  if (input.prizeItems.some((item) => !item.label || item.weight <= 0)) {
    return "Every prize needs a label and a weight greater than 0.";
  }
  return null;
}

function friendlyError(error: unknown, fallback: string): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "A prize pool with this name already exists — try a slightly different name.";
  }
  return error instanceof Error ? error.message : fallback;
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
    return { error: friendlyError(err, "Failed to create prize pool.") };
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
    return { error: friendlyError(err, "Failed to update prize pool.") };
  }

  revalidatePath("/admin/prize-pools");
  redirect("/admin/prize-pools");
}

export async function deletePrizePoolAction(id: string): Promise<void> {
  await requireAdmin();
  await deletePrizePool(id);
  revalidatePath("/admin/prize-pools");
}

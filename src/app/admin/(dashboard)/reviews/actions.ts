"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/admin/auth/dal";
import {
  createReview,
  deleteReview,
  updateReview,
  type ReviewInput,
} from "@/admin/services/reviews.service";
import { PLACEHOLDER_SOURCE, REVIEW_SOURCES } from "@/lib/reviews";

export interface ReviewFormState {
  error?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(formData: FormData, name: string, max: number): string {
  return String(formData.get(name) ?? "")
    .trim()
    .slice(0, max);
}

function parseReviewForm(formData: FormData): { input: ReviewInput } | { error: string } {
  const authorName = text(formData, "authorName", 60);
  if (!authorName) return { error: "Enter the customer's name (first name is fine)." };

  const rating = Number(formData.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Choose a rating from 1 to 5 stars." };
  }

  const body = text(formData, "body", 1000);
  if (body.length < 5) return { error: "Enter the review text." };

  const source = text(formData, "source", 30);
  const validSources: string[] = [
    ...REVIEW_SOURCES.map((option) => option.id),
    PLACEHOLDER_SOURCE,
  ];
  if (!validSources.includes(source))
    return { error: "Choose where this review came from." };

  const reviewedOn = text(formData, "reviewedOn", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewedOn))
    return { error: "Enter the date the review was given." };

  const productId = text(formData, "productId", 40) || null;
  if (productId && !UUID_PATTERN.test(productId))
    return { error: "Choose a valid product." };

  return {
    input: {
      authorName,
      location: text(formData, "location", 60) || null,
      rating,
      body,
      productId,
      orderNumber: text(formData, "orderNumber", 20) || null,
      source,
      reviewedOn,
      consentConfirmed: formData.get("consentConfirmed") === "on",
      published: formData.get("published") === "on",
      featured: formData.get("featured") === "on",
    },
  };
}

function revalidateStorefront() {
  revalidatePath("/admin/reviews");
  revalidatePath("/"); // featured reviews
  revalidatePath("/shop", "layout"); // product reviews in "Peek inside"
}

export async function createReviewAction(
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  await requireAdmin();
  const parsed = parseReviewForm(formData);
  if ("error" in parsed) return { error: parsed.error };
  try {
    await createReview(parsed.input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save review." };
  }
  revalidateStorefront();
  redirect("/admin/reviews");
}

export async function updateReviewAction(
  id: string,
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  await requireAdmin();
  const parsed = parseReviewForm(formData);
  if ("error" in parsed) return { error: parsed.error };
  try {
    await updateReview(id, parsed.input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save review." };
  }
  revalidateStorefront();
  redirect("/admin/reviews");
}

export async function deleteReviewAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteReview(id);
  revalidateStorefront();
}

/**
 * Review rules shared by the admin form and server. UK law (DMCC Act 2024) bans fake reviews, so a
 * review may only be published when it's from a real customer (a real source, not "placeholder")
 * who agreed to it being shown. The database enforces the same rules with CHECK constraints.
 */

export const REVIEW_SOURCES = [
  { id: "email", label: "Email from the customer" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "in_person", label: "In person / phone" },
  { id: "other", label: "Other (genuine customer)" },
] as const;

/** Example copy only — can never be published. Not offered for new reviews. */
export const PLACEHOLDER_SOURCE = "placeholder";

export type ReviewSource =
  (typeof REVIEW_SOURCES)[number]["id"] | typeof PLACEHOLDER_SOURCE;

export function reviewSourceLabel(source: string): string {
  if (source === PLACEHOLDER_SOURCE) return "Placeholder (example — never shown)";
  return REVIEW_SOURCES.find((option) => option.id === source)?.label ?? source;
}

/** Why a review can't be published, or null if it can. */
export function publishBlocker(review: {
  source: string;
  consentConfirmed: boolean;
}): string | null {
  if (review.source === PLACEHOLDER_SOURCE) {
    return "Placeholder reviews are examples and can't be published — add a genuine customer review instead.";
  }
  if (!review.consentConfirmed) {
    return "Tick that the customer agreed to their review being published.";
  }
  return null;
}

/** What the storefront shows — no contact details, never the order number. */
export interface PublicReview {
  id: string;
  authorName: string;
  location: string | null;
  rating: number;
  body: string;
  verifiedPurchase: boolean;
}

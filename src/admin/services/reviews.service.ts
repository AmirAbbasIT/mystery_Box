import "server-only";
import { getPrismaClient } from "@/lib/db/client";
import { normaliseOrderNumber } from "@/lib/order-number";
import { publishBlocker } from "@/lib/reviews";

/**
 * Staff-managed reviews. Publishing rules live in src/lib/reviews.ts (and are repeated as DB CHECK
 * constraints): only real, consented reviews can be published; only published ones featured.
 */

export interface ReviewInput {
  authorName: string;
  location: string | null;
  rating: number;
  body: string;
  productId: string | null;
  /** Customer-facing order number (e.g. "MPG-7K3Q9X"), resolved to the order → Verified purchase. */
  orderNumber: string | null;
  source: string;
  /** YYYY-MM-DD */
  reviewedOn: string;
  consentConfirmed: boolean;
  published: boolean;
  featured: boolean;
}

export interface ReviewRecord {
  id: string;
  authorName: string;
  location: string | null;
  rating: number;
  body: string;
  productId: string | null;
  productName: string | null;
  orderNumber: string | null;
  source: string;
  reviewedOn: string;
  consentConfirmed: boolean;
  published: boolean;
  featured: boolean;
}

const INCLUDE = {
  product: { select: { name: true } },
  order: { select: { orderNumber: true } },
} as const;

type Row = NonNullable<Awaited<ReturnType<typeof findRow>>>;

function findRow(id: string) {
  return getPrismaClient().review.findUnique({ where: { id }, include: INCLUDE });
}

function toRecord(row: Row): ReviewRecord {
  return {
    id: row.id,
    authorName: row.authorName,
    location: row.location,
    rating: row.rating,
    body: row.body,
    productId: row.productId,
    productName: row.product?.name ?? null,
    orderNumber: row.order?.orderNumber ?? null,
    source: row.source,
    reviewedOn: row.reviewedOn.toISOString().slice(0, 10),
    consentConfirmed: row.consentConfirmed,
    published: row.published,
    featured: row.featured,
  };
}

export async function listReviews(): Promise<ReviewRecord[]> {
  const rows = await getPrismaClient().review.findMany({
    include: INCLUDE,
    orderBy: [{ featured: "desc" }, { published: "desc" }, { reviewedOn: "desc" }],
  });
  return rows.map(toRecord);
}

export async function getReview(id: string): Promise<ReviewRecord | null> {
  const row = await findRow(id);
  return row ? toRecord(row) : null;
}

export async function listProductOptions(): Promise<Array<{ id: string; name: string }>> {
  return getPrismaClient().product.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** Validates the publishing rules and resolves the order number; returns DB data or an error. */
async function toData(input: ReviewInput) {
  if (input.published) {
    const blocker = publishBlocker(input);
    if (blocker) return { error: blocker } as const;
  }
  if (input.featured && !input.published) {
    return { error: "Only published reviews can be featured on the home page." } as const;
  }

  let orderId: string | null = null;
  if (input.orderNumber) {
    const orderNumber = normaliseOrderNumber(input.orderNumber);
    const order = orderNumber
      ? await getPrismaClient().order.findUnique({
          where: { orderNumber },
          select: { id: true },
        })
      : null;
    if (!order)
      return { error: `No order found with number "${input.orderNumber}".` } as const;
    orderId = order.id;
  }

  return {
    data: {
      authorName: input.authorName,
      location: input.location,
      rating: input.rating,
      body: input.body,
      productId: input.productId,
      orderId,
      source: input.source,
      reviewedOn: new Date(`${input.reviewedOn}T00:00:00Z`),
      consentConfirmed: input.consentConfirmed,
      published: input.published,
      featured: input.featured,
    },
  } as const;
}

export async function createReview(input: ReviewInput): Promise<void> {
  const result = await toData(input);
  if ("error" in result) throw new Error(result.error);
  await getPrismaClient().review.create({ data: result.data });
}

export async function updateReview(id: string, input: ReviewInput): Promise<void> {
  const result = await toData(input);
  if ("error" in result) throw new Error(result.error);
  await getPrismaClient().review.update({ where: { id }, data: result.data });
}

export async function deleteReview(id: string): Promise<void> {
  await getPrismaClient().review.delete({ where: { id } });
}

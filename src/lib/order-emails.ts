import "server-only";
import { after } from "next/server";
import { getPrismaClient } from "@/lib/db/client";
import { sendEmail } from "@/lib/email";
import { findCarrier } from "@/lib/carriers";
import { getSiteUrl } from "@/lib/seo";
import {
  BUSINESS_ADDRESS,
  BUSINESS_LEGAL_NAME,
  CONTACT_EMAIL,
  SITE_NAME,
} from "@/lib/constants";
import type { ShopDetails } from "@/lib/email/templates/layout";
import {
  renderOrderConfirmation,
  renderOrderDelivered,
  renderOrderDispatched,
  type OrderEmailData,
} from "@/lib/email/templates/order-emails";

/**
 * Customer emails about an order. Sits between the order domain and the provider-neutral email
 * layer (src/lib/email): loads the order, renders a template, sends, and logs the attempt in
 * order_emails. Never throws — a failed email must never break checkout or an admin action; it's
 * logged as "failed" and can be resent from the admin order page.
 */

export type OrderEmailKind = "confirmation" | "dispatched" | "delivered";

export const ORDER_EMAIL_LABELS: Record<OrderEmailKind, string> = {
  confirmation: "Order confirmation",
  dispatched: "Dispatch notice",
  delivered: "Delivered notice",
};

const RENDERERS = {
  confirmation: renderOrderConfirmation,
  dispatched: renderOrderDispatched,
  delivered: renderOrderDelivered,
} satisfies Record<OrderEmailKind, unknown>;

function shopDetails(): ShopDetails {
  return {
    name: SITE_NAME,
    legalName: BUSINESS_LEGAL_NAME,
    address: BUSINESS_ADDRESS,
    contactEmail: process.env.EMAIL_REPLY_TO || CONTACT_EMAIL,
    siteUrl: getSiteUrl(),
  };
}

async function loadOrder(
  orderId: string,
): Promise<{ to: string; status: string; data: OrderEmailData } | null> {
  const order = await getPrismaClient().order.findUnique({
    where: { id: orderId },
    include: { customer: true, items: true },
  });
  if (!order) return null;

  const itemsPence = order.items.reduce(
    (sum, item) => sum + item.unitPricePence * item.quantity,
    0,
  );

  return {
    to: order.customer.email,
    status: order.status,
    data: {
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      placedAt: order.createdAt,
      items: order.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        unitPricePence: item.unitPricePence,
      })),
      subtotalPence: itemsPence,
      couponCode: order.couponCode,
      discountPence: order.discountPence + order.shippingDiscountPence,
      shippingPence: order.shippingPence,
      totalPence: order.totalPence,
      delivery: {
        name: order.shippingName,
        line1: order.shippingLine1,
        line2: order.shippingLine2,
        city: order.shippingCity,
        postcode: order.shippingPostcode,
      },
      carrierName: order.carrier
        ? (findCarrier(order.carrier)?.name ?? order.carrier)
        : null,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
    },
  };
}

export type OrderEmailOutcome = "sent" | "skipped" | "failed";

/**
 * Sends one order email now. Automatic sends skip a kind that was already sent successfully;
 * `force` (admin "Resend") always sends a fresh copy.
 */
export async function sendOrderEmail(
  orderId: string,
  kind: OrderEmailKind,
  options: { force?: boolean } = {},
): Promise<{ outcome: OrderEmailOutcome; error?: string }> {
  const prisma = getPrismaClient();

  try {
    if (!options.force) {
      const alreadySent = await prisma.orderEmail.findFirst({
        where: { orderId, kind, status: "sent" },
        select: { id: true },
      });
      if (alreadySent) return { outcome: "skipped" };
    }

    const order = await loadOrder(orderId);
    if (!order) return { outcome: "failed", error: "Order not found." };
    // "Order and payment received" would be untrue for these.
    if (
      kind === "confirmation" &&
      !options.force &&
      ["payment_pending", "cancelled", "refunded"].includes(order.status)
    ) {
      return { outcome: "skipped" };
    }

    const rendered = RENDERERS[kind](order.data, shopDetails());
    const attemptId = crypto.randomUUID();

    try {
      const result = await sendEmail({
        to: order.to,
        ...rendered,
        // Automatic sends share one key per order+kind so a retried request can't duplicate the
        // email; forced resends get a unique key so they genuinely send again.
        idempotencyKey: `order-${kind}/${orderId}${options.force ? `/${attemptId}` : ""}`,
      });
      await prisma.orderEmail.create({
        data: {
          id: attemptId,
          orderId,
          kind,
          status: "sent",
          provider: result.provider,
          providerMessageId: result.id,
        },
      });
      return { outcome: "sent" };
    } catch (error) {
      const message = (error instanceof Error ? error.message : String(error)).slice(
        0,
        500,
      );
      console.error(`Order email ${kind} for ${orderId} failed: ${message}`);
      await prisma.orderEmail.create({
        data: {
          id: attemptId,
          orderId,
          kind,
          status: "failed",
          provider: process.env.EMAIL_PROVIDER ?? "console",
          error: message,
        },
      });
      return { outcome: "failed", error: message };
    }
  } catch (error) {
    console.error(`Order email ${kind} for ${orderId} could not be processed`, error);
    return { outcome: "failed", error: "Could not process this email." };
  }
}

/**
 * Sends after the current response has been returned (Next.js `after`), so emails never slow
 * down checkout or admin pages. Must be called inside a Server Action or Route Handler.
 */
export function queueOrderEmail(orderId: string, kind: OrderEmailKind): void {
  after(async () => {
    await sendOrderEmail(orderId, kind);
  });
}

import "server-only";
import { getPrismaClient } from "@/lib/db/client";
import { calculateShippingPence } from "@/lib/shipping";
import { getShippingSettings } from "@/lib/site-settings";
import {
  PayPalApiError,
  capturePayPalOrder,
  createPayPalOrder,
  getPayPalOrder,
  valueToPence,
  type PayPalOrder,
} from "@/lib/paypal";
import { Prisma } from "@/generated/prisma/client";
import type { CheckoutDetails } from "@/lib/checkout-details";

/**
 * Checkout write path. The browser only ever supplies (a) which products and how many plus the
 * (server-validated) customer/delivery details, when the PayPal order is created, and (b) a PayPal
 * order ID to capture. Everything money-related — prices, shipping, totals — comes from the
 * database and PayPal's own API, never from the client; what gets recorded on the Order comes from
 * the pending_checkouts snapshot taken at creation time.
 */

const MAX_LINES = 20;
const MAX_QUANTITY_PER_LINE = 20;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAYPAL_ORDER_ID_PATTERN = /^[A-Z0-9]{10,40}$/;

interface PendingItem {
  productId: string;
  productName: string;
  unitPricePence: number;
  quantity: number;
}

export type CheckoutResult<T> =
  ({ ok: true } & T) | { ok: false; error: string; retry?: boolean };

/** Accepts only well-formed {productId, quantity} pairs; merges duplicate lines. */
export function parseBasketRequest(input: unknown): Map<string, number> | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_LINES)
    return null;

  const quantities = new Map<string, number>();
  for (const line of input) {
    if (typeof line !== "object" || line === null) return null;
    const { productId, quantity } = line as { productId?: unknown; quantity?: unknown };
    if (typeof productId !== "string" || !UUID_PATTERN.test(productId)) return null;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1)
      return null;

    const merged = (quantities.get(productId) ?? 0) + quantity;
    if (merged > MAX_QUANTITY_PER_LINE) return null;
    quantities.set(productId, merged);
  }
  return quantities;
}

export async function startPayPalCheckout(
  quantities: Map<string, number>,
  details: CheckoutDetails,
): Promise<CheckoutResult<{ paypalOrderId: string }>> {
  const prisma = getPrismaClient();
  const products = await prisma.product.findMany({
    where: { id: { in: [...quantities.keys()] } },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const items: PendingItem[] = [];
  for (const [productId, quantity] of quantities) {
    const product = productById.get(productId);
    if (!product || !product.active) {
      return {
        ok: false,
        error: "An item in your basket is no longer available — please remove it.",
      };
    }
    if (quantity > product.stock) {
      return {
        ok: false,
        error: `Only ${product.stock} of "${product.name}" left in stock — please adjust the quantity.`,
      };
    }
    items.push({
      productId,
      productName: product.name,
      unitPricePence: product.pricePence,
      quantity,
    });
  }

  const subtotalPence = items.reduce(
    (sum, item) => sum + item.unitPricePence * item.quantity,
    0,
  );
  const shippingPence = calculateShippingPence(
    subtotalPence,
    await getShippingSettings(),
  );
  const totalPence = subtotalPence + shippingPence;
  const requestId = crypto.randomUUID();
  const shippingName = details.recipientName ?? details.fullName;

  const paypalOrder = await createPayPalOrder({
    items: items.map((item) => ({
      sku: item.productId,
      name: item.productName,
      unitPricePence: item.unitPricePence,
      quantity: item.quantity,
    })),
    subtotalPence,
    shippingPence,
    totalPence,
    shipping: {
      name: shippingName,
      line1: details.line1,
      line2: details.line2,
      city: details.city,
      postcode: details.postcode,
    },
    requestId,
  });

  await prisma.pendingCheckout.create({
    data: {
      id: requestId,
      paypalOrderId: paypalOrder.id,
      items: items as unknown as Prisma.InputJsonValue,
      subtotalPence,
      shippingPence,
      totalPence,
      customerName: details.fullName,
      customerEmail: details.email,
      customerPhone: details.phone,
      shippingName,
      shippingLine1: details.line1,
      shippingLine2: details.line2,
      shippingCity: details.city,
      shippingPostcode: details.postcode,
    },
  });

  return { ok: true, paypalOrderId: paypalOrder.id };
}

function amountMatches(
  money: { currency_code: string; value: string } | undefined,
  pence: number,
) {
  return money?.currency_code === "GBP" && valueToPence(money.value) === pence;
}

/**
 * Captures an approved PayPal order and records it as an Order. Safe to call more than once for
 * the same order, from the browser's onApprove and from the webhook concurrently: capture is
 * idempotent at PayPal via PayPal-Request-Id, and Order.paypalOrderId is unique here.
 */
export async function completePayPalCheckout(
  paypalOrderId: string,
): Promise<CheckoutResult<{ orderId: string }>> {
  if (!PAYPAL_ORDER_ID_PATTERN.test(paypalOrderId)) {
    return { ok: false, error: "Invalid payment reference." };
  }

  const prisma = getPrismaClient();
  const existing = await prisma.order.findUnique({ where: { paypalOrderId } });
  if (existing) return { ok: true, orderId: existing.id };

  const pending = await prisma.pendingCheckout.findUnique({ where: { paypalOrderId } });
  if (!pending)
    return { ok: false, error: "We couldn't find this checkout — please try again." };
  const items = pending.items as unknown as PendingItem[];

  let paypalOrder: PayPalOrder = await getPayPalOrder(paypalOrderId);
  const unit = paypalOrder.purchase_units?.[0];

  if (!amountMatches(unit?.amount, pending.totalPence)) {
    console.error(
      `PayPal order ${paypalOrderId} amount does not match pending checkout ${pending.id}.`,
    );
    return { ok: false, error: "Payment amount mismatch — you have not been charged." };
  }
  const paypalAddress = unit?.shipping?.address;
  const samePostcode = (a: string | undefined, b: string) =>
    a?.replace(/\s/g, "").toUpperCase() === b.replace(/\s/g, "");
  if (
    paypalAddress?.country_code !== "GB" ||
    !samePostcode(paypalAddress.postal_code, pending.shippingPostcode)
  ) {
    console.error(
      `PayPal order ${paypalOrderId} delivery address differs from checkout ${pending.id}.`,
    );
    return {
      ok: false,
      error:
        "The delivery address didn't match what you entered — you have not been charged.",
    };
  }

  if (paypalOrder.status === "APPROVED") {
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((item) => item.productId) } },
    });
    const stockById = new Map(products.map((p) => [p.id, p.active ? p.stock : 0]));
    const soldOut = items.find(
      (item) => (stockById.get(item.productId) ?? 0) < item.quantity,
    );
    if (soldOut) {
      return {
        ok: false,
        error: `Sorry — "${soldOut.productName}" sold out while you were paying. You have not been charged.`,
      };
    }

    try {
      paypalOrder = await capturePayPalOrder(paypalOrderId, `capture-${pending.id}`);
    } catch (error) {
      if (error instanceof PayPalApiError && error.issue === "INSTRUMENT_DECLINED") {
        return { ok: false, error: "Your payment method was declined.", retry: true };
      }
      if (error instanceof PayPalApiError && error.issue === "ORDER_ALREADY_CAPTURED") {
        paypalOrder = await getPayPalOrder(paypalOrderId);
      } else {
        throw error;
      }
    }
  } else if (paypalOrder.status !== "COMPLETED") {
    return { ok: false, error: "This payment hasn't been approved yet." };
  }

  const captured = paypalOrder.purchase_units?.[0];
  const capture = captured?.payments?.captures?.[0];
  if (!capture || (capture.status !== "COMPLETED" && capture.status !== "PENDING")) {
    return {
      ok: false,
      error: "Your payment could not be completed. You have not been charged.",
    };
  }
  if (!amountMatches(capture.amount, pending.totalPence)) {
    console.error(
      `PayPal capture ${capture.id} amount does not match pending checkout ${pending.id}.`,
    );
    return { ok: false, error: "Payment amount mismatch — please contact us." };
  }

  const email = pending.customerEmail;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { email },
        update: { name: pending.customerName },
        create: { email, name: pending.customerName },
      });

      const created = await tx.order.create({
        data: {
          customerId: customer.id,
          status: capture.status === "COMPLETED" ? "paid" : "payment_pending",
          totalPence: pending.totalPence,
          shippingPence: pending.shippingPence,
          paypalOrderId,
          paypalCaptureId: capture.id,
          contactPhone: pending.customerPhone,
          shippingName: pending.shippingName,
          shippingLine1: pending.shippingLine1,
          shippingLine2: pending.shippingLine2,
          shippingCity: pending.shippingCity,
          shippingPostcode: pending.shippingPostcode,
          shippingCountry: "GB",
          items: { create: items },
        },
      });

      for (const item of items) {
        // updateMany (not update) so a since-deleted product is a silent no-op — stock
        // reconciliation is best-effort and must never block recording a captured payment.
        await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    return { ok: true, orderId: order.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const winner = await prisma.order.findUnique({ where: { paypalOrderId } });
      if (winner) return { ok: true, orderId: winner.id };
    }
    throw error;
  }
}

export type CaptureStatusUpdate = "paid" | "cancelled" | "refunded";

/** Webhook-driven status changes for an already-recorded capture (settled, denied, refunded). */
export async function updateOrderByCaptureId(
  captureId: string,
  status: CaptureStatusUpdate,
): Promise<void> {
  await getPrismaClient().order.updateMany({
    where: {
      paypalCaptureId: captureId,
      ...(status === "paid" ? { status: "payment_pending" } : {}),
    },
    data: { status, updatedAt: new Date() },
  });
}

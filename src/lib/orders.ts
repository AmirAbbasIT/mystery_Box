import "server-only";
import { getPrismaClient } from "@/lib/db/client";
import { getShippingSettings } from "@/lib/site-settings";
import { calculateOrderTotals, type CouponPricing } from "@/lib/coupons";
import { checkCoupon, findCouponByCode, findCouponById } from "@/lib/coupons.server";
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
import { generateOrderNumber } from "@/lib/order-number";

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
  | ({ ok: true } & T)
  | {
      ok: false;
      error: string;
      retry?: boolean;
      /** The promo code was rejected (the rest of the checkout may be fine). */
      couponRejected?: boolean;
      /** The code doesn't exist at all — counts towards the guessing limit. */
      unknownCoupon?: boolean;
    };

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

/** Re-prices the basket from the DB (never the browser's prices) and checks stock/availability. */
async function priceBasket(
  quantities: Map<string, number>,
): Promise<CheckoutResult<{ items: PendingItem[]; subtotalPence: number }>> {
  const products = await getPrismaClient().product.findMany({
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
  return { ok: true, items, subtotalPence };
}

/** Apply-button preview: is this code usable for this basket (and this email, if known yet)? */
export async function previewCoupon(
  quantities: Map<string, number>,
  code: string,
  email: string | null,
): Promise<CheckoutResult<{ pricing: CouponPricing }>> {
  const basket = await priceBasket(quantities);
  if (!basket.ok) return basket;

  const check = await checkCoupon(await findCouponByCode(code), {
    subtotalPence: basket.subtotalPence,
    email,
  });
  if (!check.ok) {
    return {
      ok: false,
      error: check.error,
      couponRejected: true,
      unknownCoupon: check.unknownCode,
    };
  }
  return { ok: true, pricing: check.pricing };
}

export async function startPayPalCheckout(
  quantities: Map<string, number>,
  details: CheckoutDetails,
  paymentSource: "paypal" | "card",
  couponCode: string | null,
): Promise<CheckoutResult<{ paypalOrderId: string }>> {
  const prisma = getPrismaClient();
  const basket = await priceBasket(quantities);
  if (!basket.ok) return basket;
  const { items, subtotalPence } = basket;

  let coupon: { id: string; pricing: CouponPricing } | null = null;
  if (couponCode) {
    const check = await checkCoupon(await findCouponByCode(couponCode), {
      subtotalPence,
      email: details.email,
    });
    if (!check.ok) {
      return {
        ok: false,
        error: `${check.error} Remove the code to continue without it.`,
        couponRejected: true,
        unknownCoupon: check.unknownCode,
      };
    }
    coupon = { id: check.coupon.id, pricing: check.pricing };
  }

  const totals = calculateOrderTotals(
    subtotalPence,
    await getShippingSettings(),
    coupon?.pricing ?? null,
  );
  if (totals.totalPence <= 0) {
    return {
      ok: false,
      error:
        "This code covers your whole order — please contact us and we'll complete it for you.",
      couponRejected: true,
    };
  }
  const requestId = crypto.randomUUID();
  const orderNumber = generateOrderNumber();
  const shippingName = details.recipientName ?? details.fullName;

  const paypalOrder = await createPayPalOrder({
    items: items.map((item) => ({
      sku: item.productId,
      name: item.productName,
      unitPricePence: item.unitPricePence,
      quantity: item.quantity,
    })),
    subtotalPence,
    shippingPence: totals.shippingPence,
    discountPence: totals.discountPence,
    shippingDiscountPence: totals.shippingDiscountPence,
    totalPence: totals.totalPence,
    shipping: {
      name: shippingName,
      line1: details.line1,
      line2: details.line2,
      city: details.city,
      postcode: details.postcode,
    },
    paymentSource,
    invoiceId: orderNumber,
    requestId,
  });

  await prisma.pendingCheckout.create({
    data: {
      id: requestId,
      paypalOrderId: paypalOrder.id,
      orderNumber,
      items: items as unknown as Prisma.InputJsonValue,
      subtotalPence,
      shippingPence: totals.shippingPence,
      totalPence: totals.totalPence,
      couponId: coupon?.id ?? null,
      couponCode: coupon?.pricing.code ?? null,
      discountPence: totals.discountPence,
      shippingDiscountPence: totals.shippingDiscountPence,
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
    // Card payments: PayPal's 3-D Secure guidance — capture only if liability may shift to the
    // issuer (POSSIBLE/YES). NO or UNKNOWN means verification failed or couldn't run, so don't
    // charge. No authentication_result = 3-D Secure wasn't required for this card.
    const authentication = paypalOrder.payment_source?.card?.authentication_result;
    if (
      authentication &&
      authentication.liability_shift !== "POSSIBLE" &&
      authentication.liability_shift !== "YES"
    ) {
      return {
        ok: false,
        error:
          "Your bank couldn't verify this card. You have not been charged — please try again or use another card.",
      };
    }

    // The code may have expired, been switched off or run out while they were paying. The price
    // is already fixed in the PayPal order, so refuse rather than charge an invalid discount.
    if (pending.couponId) {
      const couponCheck = await checkCoupon(await findCouponById(pending.couponId), {
        subtotalPence: pending.subtotalPence,
        email: pending.customerEmail,
      });
      if (!couponCheck.ok) {
        return {
          ok: false,
          error: `${couponCheck.error} You have not been charged — remove the code and pay again.`,
          couponRejected: true,
        };
      }
    }

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

  // Retries only cover the (≈1 in 10^8) chance of a random order number colliding; a unique
  // clash on paypalOrderId means a concurrent call already recorded this order.
  for (let attempt = 1; ; attempt++) {
    try {
      const order = await prisma.$transaction(async (tx) => {
        // Normally guaranteed by the pre-capture check; only missing if an admin deleted an unused
        // coupon mid-payment after capture already happened — keep the code snapshot, drop the FK.
        const couponId =
          pending.couponId &&
          (await tx.coupon.findUnique({
            where: { id: pending.couponId },
            select: { id: true },
          }))
            ? pending.couponId
            : null;

        const customer = await tx.customer.upsert({
          where: { email },
          update: { name: pending.customerName },
          create: { email, name: pending.customerName },
        });

        const created = await tx.order.create({
          data: {
            // The number already sent to PayPal as invoice_id; a fresh one only on a retry after a
            // (practically impossible) clash, or for checkouts started before numbers existed.
            orderNumber:
              attempt === 1 && pending.orderNumber
                ? pending.orderNumber
                : generateOrderNumber(),
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
            couponId,
            couponCode: pending.couponCode,
            discountPence: pending.discountPence,
            shippingDiscountPence: pending.shippingDiscountPence,
            items: { create: items },
          },
        });

        // The only place a coupon use is counted — after payment, in the same transaction that
        // records the order, so abandoned checkouts never use one up.
        if (couponId) {
          await tx.coupon.update({
            where: { id: couponId },
            data: { timesUsed: { increment: 1 } },
          });
        }

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
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const winner = await prisma.order.findUnique({ where: { paypalOrderId } });
        if (winner) return { ok: true, orderId: winner.id };
        if (attempt < 3) continue;
      }
      throw error;
    }
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

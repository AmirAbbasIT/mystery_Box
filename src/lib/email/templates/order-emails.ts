import {
  button,
  escapeHtml,
  layout,
  money,
  textFooter,
  type RenderedEmail,
  type ShopDetails,
} from "./layout";

/** Plain order data for templates — mapped from the DB in src/lib/order-emails.ts. */
export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  placedAt: Date;
  items: Array<{ name: string; quantity: number; unitPricePence: number }>;
  subtotalPence: number;
  couponCode: string | null;
  /** Item discount + shipping waived by a coupon. */
  discountPence: number;
  /** Shipping actually charged (after any free-shipping coupon). */
  shippingPence: number;
  totalPence: number;
  delivery: {
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    postcode: string;
  };
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/London",
});

function firstName(name: string): string {
  return name.split(" ")[0] || name;
}

function deliveryLines(order: OrderEmailData): string[] {
  const { delivery } = order;
  return [
    delivery.name,
    delivery.line1,
    delivery.line2,
    delivery.city,
    delivery.postcode,
    "United Kingdom",
  ].filter((line): line is string => Boolean(line));
}

function trackPageUrl(shop: ShopDetails): string {
  return `${shop.siteUrl}/track`;
}

function summaryRows(order: OrderEmailData): Array<[string, string]> {
  const rows: Array<[string, string]> = order.items.map((item) => [
    `${item.quantity} × ${item.name}`,
    money(item.unitPricePence * item.quantity),
  ]);
  if (order.discountPence > 0) {
    rows.push([
      `Discount${order.couponCode ? ` (${order.couponCode})` : ""}`,
      `−${money(order.discountPence)}`,
    ]);
  }
  rows.push([
    "UK delivery",
    order.shippingPence === 0 ? "Free" : money(order.shippingPence),
  ]);
  return rows;
}

function summaryHtml(order: OrderEmailData): string {
  const rows = summaryRows(order)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0">${escapeHtml(label)}</td><td style="padding:6px 0;text-align:right;white-space:nowrap">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:1px solid #eee3f7;border-bottom:1px solid #eee3f7">
    ${rows}
    <tr><td style="padding:10px 0;font-weight:800">Total paid</td><td style="padding:10px 0;text-align:right;font-weight:800">${escapeHtml(money(order.totalPence))}</td></tr>
  </table>`;
}

function summaryText(order: OrderEmailData): string {
  return [
    ...summaryRows(order).map(([label, value]) => `${label}: ${value}`),
    `Total paid: ${money(order.totalPence)}`,
  ].join("\n");
}

/**
 * Order confirmation. Doubles as the Consumer Contracts Regulations 2013 "confirmation in a
 * durable medium": trader identity + address (footer), what was bought and the total including
 * delivery, delivery arrangements, and the cancellation right. Keep the cancellation wording in
 * line with the shop's published returns policy.
 */
export function renderOrderConfirmation(
  order: OrderEmailData,
  shop: ShopDetails,
): RenderedEmail {
  const subject = `Order confirmed — ${order.orderNumber}`;
  const placed = dateFormatter.format(order.placedAt);
  const cancellation =
    "You can cancel your order within 14 days of receiving it, without giving a reason — just email us with your order number. " +
    "For hygiene reasons, sealed beauty and cosmetic items can't be returned once unsealed, and custom-made orders can't be cancelled once we've started making them. " +
    "If something arrives faulty or damaged, contact us and we'll put it right.";

  const html = layout(
    shop,
    subject,
    `<h1 style="font-size:22px;margin:0 0 8px">Thank you, ${escapeHtml(firstName(order.customerName))}!</h1>
    <p style="margin:0 0 8px">We've received your order and payment. We'll hand-pack it and email you as soon as it's on its way.</p>
    <p style="margin:0 0 4px">Order number: <strong style="font-family:monospace;font-size:16px">${escapeHtml(order.orderNumber)}</strong></p>
    <p style="margin:0;color:#6d6475">Placed ${escapeHtml(placed)}</p>
    ${summaryHtml(order)}
    <p style="margin:0 0 4px;font-weight:700">Delivering to</p>
    <p style="margin:0 0 20px">${deliveryLines(order).map(escapeHtml).join("<br>")}</p>
    <p style="margin:0 0 20px">${button(trackPageUrl(shop), "Track your order")}</p>
    <p style="margin:0 0 4px;font-weight:700">Your right to cancel</p>
    <p style="margin:0 0 8px;font-size:13px;color:#4b4352">${escapeHtml(cancellation)}
    Full details: <a href="${escapeHtml(`${shop.siteUrl}/legal-notice`)}" style="color:#7a3dc2">returns &amp; refunds policy</a>.</p>`,
  );

  const text = [
    `Thank you, ${firstName(order.customerName)}!`,
    "",
    "We've received your order and payment. We'll hand-pack it and email you as soon as it's on its way.",
    "",
    `Order number: ${order.orderNumber}`,
    `Placed: ${placed}`,
    "",
    summaryText(order),
    "",
    "Delivering to:",
    ...deliveryLines(order),
    "",
    `Track your order: ${trackPageUrl(shop)}`,
    "",
    "Your right to cancel",
    cancellation,
    `Full details: ${shop.siteUrl}/legal-notice`,
    "",
    textFooter(shop),
  ].join("\n");

  return { subject, html, text };
}

export function renderOrderDispatched(
  order: OrderEmailData,
  shop: ShopDetails,
): RenderedEmail {
  const subject = `Your order is on its way — ${order.orderNumber}`;
  const carrier = order.carrierName ?? "our courier";
  const trackingLine = order.trackingNumber
    ? `Tracking number: ${order.trackingNumber}`
    : "This parcel was sent with an untracked service.";

  const html = layout(
    shop,
    subject,
    `<h1 style="font-size:22px;margin:0 0 8px">It's on its way, ${escapeHtml(firstName(order.customerName))}!</h1>
    <p style="margin:0 0 8px">Your order <strong style="font-family:monospace">${escapeHtml(order.orderNumber)}</strong> has been dispatched with <strong>${escapeHtml(carrier)}</strong>.</p>
    <p style="margin:0 0 20px">${escapeHtml(trackingLine)}</p>
    ${order.trackingUrl ? `<p style="margin:0 0 20px">${button(order.trackingUrl, `Track with ${carrier}`)}</p>` : ""}
    <p style="margin:0 0 4px;font-weight:700">Delivering to</p>
    <p style="margin:0 0 20px">${deliveryLines(order).map(escapeHtml).join("<br>")}</p>
    <p style="margin:0">You can also check your order any time on our <a href="${escapeHtml(trackPageUrl(shop))}" style="color:#7a3dc2">tracking page</a> with your order number and email.</p>`,
  );

  const text = [
    `It's on its way, ${firstName(order.customerName)}!`,
    "",
    `Your order ${order.orderNumber} has been dispatched with ${carrier}.`,
    trackingLine,
    order.trackingUrl ? `Track it: ${order.trackingUrl}` : null,
    "",
    "Delivering to:",
    ...deliveryLines(order),
    "",
    `Check your order any time: ${trackPageUrl(shop)}`,
    "",
    textFooter(shop),
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { subject, html, text };
}

export function renderOrderDelivered(
  order: OrderEmailData,
  shop: ShopDetails,
): RenderedEmail {
  const subject = `Delivered — ${order.orderNumber}`;

  const html = layout(
    shop,
    subject,
    `<h1 style="font-size:22px;margin:0 0 8px">Your order has arrived!</h1>
    <p style="margin:0 0 8px">Hi ${escapeHtml(firstName(order.customerName))}, order <strong style="font-family:monospace">${escapeHtml(order.orderNumber)}</strong> has been delivered. Enjoy the reveal!</p>
    <p style="margin:0">If anything isn't right, just reply to this email and we'll help.</p>`,
  );

  const text = [
    "Your order has arrived!",
    "",
    `Hi ${firstName(order.customerName)}, order ${order.orderNumber} has been delivered. Enjoy the reveal!`,
    "If anything isn't right, just reply to this email and we'll help.",
    "",
    textFooter(shop),
  ].join("\n");

  return { subject, html, text };
}

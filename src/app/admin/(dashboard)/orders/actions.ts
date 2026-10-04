"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/admin/auth/dal";
import {
  updateOrderStatus,
  type OrderStatusUpdate,
} from "@/admin/services/orders.service";
import { findCarrier } from "@/lib/carriers";
import {
  ORDER_EMAIL_LABELS,
  queueOrderEmail,
  sendOrderEmail,
  type OrderEmailKind,
} from "@/lib/order-emails";
import { STAFF_ORDER_STATUSES, type OrderStatus } from "@/types/order";

export interface OrderStatusFormState {
  error?: string;
  success?: string;
}

function parseDispatch(formData: FormData): OrderStatusUpdate["dispatch"] | string {
  const carrier = findCarrier(String(formData.get("carrier") ?? ""));
  if (!carrier) return "Choose the carrier.";

  const trackingNumber = String(formData.get("trackingNumber") ?? "")
    .trim()
    .toUpperCase();
  if (trackingNumber && !/^[A-Z0-9 -]{4,50}$/.test(trackingNumber)) {
    return "Tracking numbers can only contain letters, numbers, spaces and dashes.";
  }

  const pastedUrl = String(formData.get("trackingUrl") ?? "").trim();
  let trackingUrl: string | null = null;
  if (pastedUrl) {
    try {
      const url = new URL(pastedUrl);
      if (url.protocol !== "https:" || pastedUrl.length > 500) throw new Error();
      trackingUrl = url.toString();
    } catch {
      return "Tracking link must be a full https:// address.";
    }
  } else if (trackingNumber && carrier.trackingUrl) {
    trackingUrl = carrier.trackingUrl(trackingNumber);
  }

  return { carrier: carrier.id, trackingNumber: trackingNumber || null, trackingUrl };
}

export async function updateOrderStatusAction(
  id: string,
  _prevState: OrderStatusFormState,
  formData: FormData,
): Promise<OrderStatusFormState> {
  await requireAdmin();

  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!STAFF_ORDER_STATUSES.includes(status)) {
    return { error: "Invalid status." };
  }

  const update: OrderStatusUpdate = { status };
  if (status === "dispatched") {
    const dispatch = parseDispatch(formData);
    if (typeof dispatch === "string") return { error: dispatch };
    update.dispatch = dispatch;
  }

  let previousStatus: OrderStatus;
  try {
    ({ previousStatus } = await updateOrderStatus(id, update));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update order." };
  }

  // Only on an actual change, so re-saving (e.g. correcting a tracking number) doesn't email the
  // customer again — use "Resend" for that.
  const emailKind: OrderEmailKind | null =
    previousStatus !== status && (status === "dispatched" || status === "delivered")
      ? status
      : null;
  if (emailKind) queueOrderEmail(id, emailKind);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return {
    success: emailKind
      ? `Order updated — the ${ORDER_EMAIL_LABELS[emailKind].toLowerCase()} email is being sent.`
      : "Order updated — the customer will see this on the tracking page.",
  };
}

const RESENDABLE: OrderEmailKind[] = ["confirmation", "dispatched", "delivered"];

/** Admin "Resend" — sends immediately (not deferred) so the result can be shown straight away. */
export async function resendOrderEmailAction(
  id: string,
  kind: OrderEmailKind,
): Promise<OrderStatusFormState> {
  await requireAdmin();
  if (!RESENDABLE.includes(kind)) return { error: "Unknown email type." };

  const result = await sendOrderEmail(id, kind, { force: true });
  revalidatePath(`/admin/orders/${id}`);
  return result.outcome === "sent"
    ? { success: `${ORDER_EMAIL_LABELS[kind]} sent.` }
    : { error: `Couldn't send: ${result.error ?? "unknown error"}` };
}

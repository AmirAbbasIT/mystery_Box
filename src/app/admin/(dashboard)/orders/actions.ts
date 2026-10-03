"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/admin/auth/dal";
import {
  updateOrderStatus,
  type OrderStatusUpdate,
} from "@/admin/services/orders.service";
import { findCarrier } from "@/lib/carriers";
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

  try {
    await updateOrderStatus(id, update);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update order." };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return { success: "Order updated — the customer will see this on the tracking page." };
}

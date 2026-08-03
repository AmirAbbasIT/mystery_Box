"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/admin/auth/dal";
import { updateOrderStatus } from "@/admin/services/orders.service";
import type { OrderStatus } from "@/types/order";

export interface OrderStatusFormState {
  error?: string;
}

const VALID_STATUSES: OrderStatus[] = ["paid", "fulfilled", "cancelled"];

export async function updateOrderStatusAction(
  id: string,
  _prevState: OrderStatusFormState,
  formData: FormData,
): Promise<OrderStatusFormState> {
  await requireAdmin();

  const status = String(formData.get("status") ?? "");
  if (!VALID_STATUSES.includes(status as OrderStatus)) {
    return { error: "Invalid status." };
  }

  await updateOrderStatus(id, status as OrderStatus);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return {};
}

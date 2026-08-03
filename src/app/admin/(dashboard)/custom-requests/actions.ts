"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/admin/auth/dal";
import {
  updateCustomRequestStatus,
  type CustomRequestStatus,
} from "@/admin/services/custom-requests.service";

export interface CustomRequestUpdateState {
  error?: string;
}

const VALID_STATUSES: CustomRequestStatus[] = [
  "new",
  "contacted",
  "quoted",
  "completed",
  "archived",
];

export async function updateCustomRequestAction(
  id: string,
  _prevState: CustomRequestUpdateState,
  formData: FormData,
): Promise<CustomRequestUpdateState> {
  await requireAdmin();

  const status = String(formData.get("status") ?? "new");
  if (!VALID_STATUSES.includes(status as CustomRequestStatus)) {
    return { error: "Invalid status." };
  }
  const staffNotes = String(formData.get("staffNotes") ?? "").trim() || null;

  try {
    await updateCustomRequestStatus(id, status as CustomRequestStatus, staffNotes);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update request." };
  }

  revalidatePath("/admin/custom-requests");
  redirect("/admin/custom-requests");
}

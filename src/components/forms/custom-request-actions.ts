"use server";

import { createCustomRequest } from "@/lib/custom-requests";
import type { CustomRequestInput } from "@/types/custom-request";

export interface CustomRequestFormState {
  error?: string;
  success?: boolean;
  submittedName?: string;
  submittedEmail?: string;
}

export async function submitCustomRequestAction(
  _prevState: CustomRequestFormState,
  formData: FormData,
): Promise<CustomRequestFormState> {
  const input: CustomRequestInput = {
    recipientType: formData.get("recipientType") === "adult" ? "adult" : "kids",
    ageRange: String(formData.get("ageRange") ?? "").trim(),
    occasion: String(formData.get("occasion") ?? "").trim(),
    themePreference: String(formData.get("themePreference") ?? "").trim() || undefined,
    budget: Number(formData.get("budget")) || 0,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
    contactName: String(formData.get("contactName") ?? "").trim(),
    contactEmail: String(formData.get("contactEmail") ?? "").trim(),
  };

  if (!input.ageRange || !input.occasion || !input.contactName || !input.contactEmail) {
    return { error: "Please fill in all required fields." };
  }

  try {
    await createCustomRequest(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to submit your request. Please try again." };
  }

  return { success: true, submittedName: input.contactName, submittedEmail: input.contactEmail };
}

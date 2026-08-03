import { getPrismaClient } from "@/lib/db/client";
import type { CustomRequestInput } from "@/types/custom-request";

/**
 * Public write path for CustomRequestForm — no admin auth involved, since this is a customer
 * submitting a request, not a staff action. Separate from
 * src/admin/services/custom-requests.service.ts the same way lib/catalogue.ts stays separate
 * from admin's product writes: this file only ever creates a row, never reads/lists/updates one.
 */
export async function createCustomRequest(input: CustomRequestInput): Promise<void> {
  await getPrismaClient().customRequest.create({
    data: {
      recipientType: input.recipientType,
      ageRange: input.ageRange,
      occasion: input.occasion,
      themePreference: input.themePreference || null,
      budgetPence: Math.round(input.budget * 100),
      notes: input.notes || null,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
    },
  });
}

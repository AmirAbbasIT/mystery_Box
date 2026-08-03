export type RecipientType = "kids" | "adult";

export interface CustomRequestInput {
  recipientType: RecipientType;
  ageRange: string;
  occasion: string;
  themePreference?: string;
  /** GBP — a custom gift-box-packing request for one recipient, not a party/multi-person quote. */
  budget: number;
  notes?: string;
  contactName: string;
  contactEmail: string;
}

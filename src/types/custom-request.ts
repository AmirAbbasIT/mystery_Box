export type RecipientType = "kids" | "adult";

export interface CustomRequestInput {
  recipientType: RecipientType;
  ageRange: string;
  occasion: string;
  themePreference?: string;
  budget: number;
  notes?: string;
  contactName: string;
  contactEmail: string;
}

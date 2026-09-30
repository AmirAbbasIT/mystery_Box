/**
 * Customer + delivery details collected on /checkout before payment. Pure (no server imports) so
 * the checkout form shows the same errors the server enforces — the server always re-validates in
 * createPayPalOrderAction, since anything from the browser can be tampered with.
 */

export interface CheckoutDetails {
  fullName: string;
  email: string;
  phone: string | null;
  /** Who the parcel is addressed to — gifts are often sent to someone else. Null = fullName. */
  recipientName: string | null;
  line1: string;
  line2: string | null;
  city: string;
  /** Normalised UK format, e.g. "SW1A 1AA". */
  postcode: string;
}

export type CheckoutField = keyof CheckoutDetails;

export type CheckoutDetailsResult =
  | { ok: true; details: CheckoutDetails }
  | { ok: false; errors: Partial<Record<CheckoutField, string>> };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UK_POSTCODE_PATTERN = /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/;
const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;

function clean(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function validateCheckoutDetails(input: unknown): CheckoutDetailsResult {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<
    string,
    unknown
  >;
  const errors: Partial<Record<CheckoutField, string>> = {};

  const fullName = clean(raw.fullName, 100);
  if (fullName.length < 2) errors.fullName = "Enter your full name.";

  const email = clean(raw.email, 254).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address.";

  const phone = clean(raw.phone, 20);
  if (phone && !PHONE_PATTERN.test(phone)) errors.phone = "Enter a valid phone number.";

  const recipientName = clean(raw.recipientName, 100);

  const line1 = clean(raw.line1, 100);
  if (line1.length < 2) errors.line1 = "Enter the first line of the address.";

  const line2 = clean(raw.line2, 100);

  const city = clean(raw.city, 60);
  if (city.length < 2) errors.city = "Enter the town or city.";

  const postcodeMatch = UK_POSTCODE_PATTERN.exec(clean(raw.postcode, 10).toUpperCase());
  if (!postcodeMatch) errors.postcode = "Enter a valid UK postcode.";

  if (Object.keys(errors).length > 0 || !postcodeMatch) return { ok: false, errors };

  return {
    ok: true,
    details: {
      fullName,
      email,
      phone: phone || null,
      recipientName: recipientName || null,
      line1,
      line2: line2 || null,
      city,
      postcode: `${postcodeMatch[1]} ${postcodeMatch[2]}`,
    },
  };
}

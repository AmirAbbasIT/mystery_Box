"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/admin/auth/dal";
import {
  createCoupon,
  deleteCoupon,
  updateCoupon,
  type CouponInput,
} from "@/admin/services/coupons.service";
import { Prisma } from "@/generated/prisma/client";
import {
  COUPON_DISCOUNT_TYPES,
  normaliseCouponCode,
  type CouponDiscountType,
} from "@/lib/coupons";
import { addDays, londonMidnight } from "@/lib/london-time";

export interface CouponFormState {
  error?: string;
}

type Parsed = { ok: true; input: CouponInput } | { ok: false; error: string };

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/** "" -> null; "12.50" / "£12.50" -> 1250; anything else -> NaN. */
function optionalPence(raw: string): number | null {
  if (raw === "") return null;
  const match = /^(\d{1,6})(?:\.(\d{1,2}))?$/.exec(raw.replace(/^£/, ""));
  if (!match) return Number.NaN;
  return Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0"));
}

/** "" -> null; positive whole number -> number; anything else -> NaN. */
function optionalCount(raw: string): number | null {
  if (raw === "") return null;
  return /^\d{1,7}$/.test(raw) && Number(raw) > 0 ? Number(raw) : Number.NaN;
}

function parseCouponForm(formData: FormData): Parsed {
  const code = normaliseCouponCode(text(formData, "code"));
  if (!code) return { ok: false, error: "Code must be 2–40 letters, numbers, - or _." };

  const discountType = text(formData, "discountType") as CouponDiscountType;
  if (!COUPON_DISCOUNT_TYPES.includes(discountType)) {
    return { ok: false, error: "Choose a discount type." };
  }

  let percentOff: number | null = null;
  let amountOffPence: number | null = null;
  let maxDiscountPence: number | null = null;

  if (discountType === "percentage") {
    percentOff = Number(text(formData, "percentOff"));
    if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100) {
      return { ok: false, error: "Percentage must be a whole number from 1 to 100." };
    }
    maxDiscountPence = optionalPence(text(formData, "maxDiscount"));
    if (Number.isNaN(maxDiscountPence) || maxDiscountPence === 0) {
      return {
        ok: false,
        error: "Maximum discount must be an amount like 15 or 15.00, or blank.",
      };
    }
  } else if (discountType === "fixed") {
    amountOffPence = optionalPence(text(formData, "amountOff"));
    if (amountOffPence === null || Number.isNaN(amountOffPence) || amountOffPence <= 0) {
      return { ok: false, error: "Enter the amount off, e.g. 5 or 5.00." };
    }
  }

  const minSubtotalPence = optionalPence(text(formData, "minSubtotal"));
  if (Number.isNaN(minSubtotalPence)) {
    return {
      ok: false,
      error: "Minimum order must be an amount like 20 or 20.00, or blank.",
    };
  }

  const usageLimit = optionalCount(text(formData, "usageLimit"));
  const perCustomerLimit = optionalCount(text(formData, "perCustomerLimit"));
  if (Number.isNaN(usageLimit) || Number.isNaN(perCustomerLimit)) {
    return {
      ok: false,
      error: "Usage limits must be whole numbers above 0, or blank for no limit.",
    };
  }

  const startsOn = text(formData, "startsOn");
  const endsOn = text(formData, "endsOn");
  const startsAt = startsOn ? londonMidnight(startsOn) : null;
  // "Ends on 31 Oct" means usable all of 31 Oct (UK time), so it stops at midnight starting 1 Nov.
  const endsAt = endsOn ? londonMidnight(addDays(endsOn, 1)) : null;
  if ((startsOn && !startsAt) || (endsOn && !endsAt)) {
    return { ok: false, error: "Enter valid start and end dates." };
  }
  if (startsAt && endsAt && endsAt <= startsAt) {
    return { ok: false, error: "The end date must be on or after the start date." };
  }

  return {
    ok: true,
    input: {
      code,
      note: text(formData, "note").slice(0, 200) || null,
      discountType,
      percentOff,
      amountOffPence,
      maxDiscountPence,
      minSubtotalPence,
      usageLimit,
      perCustomerLimit,
      startsAt,
      endsAt,
      active: formData.get("active") === "on",
    },
  };
}

function friendlyError(error: unknown, fallback: string): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "A coupon with this code already exists.";
  }
  return error instanceof Error ? error.message : fallback;
}

export async function createCouponAction(
  _prevState: CouponFormState,
  formData: FormData,
): Promise<CouponFormState> {
  await requireAdmin();

  const parsed = parseCouponForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  try {
    await createCoupon(parsed.input);
  } catch (error) {
    return { error: friendlyError(error, "Failed to create coupon.") };
  }

  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function updateCouponAction(
  id: string,
  _prevState: CouponFormState,
  formData: FormData,
): Promise<CouponFormState> {
  await requireAdmin();

  const parsed = parseCouponForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  try {
    await updateCoupon(id, parsed.input);
  } catch (error) {
    return { error: friendlyError(error, "Failed to update coupon.") };
  }

  revalidatePath("/admin/coupons");
  revalidatePath(`/admin/coupons/${id}`);
  redirect("/admin/coupons");
}

export async function deleteCouponAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteCoupon(id);
  revalidatePath("/admin/coupons");
}

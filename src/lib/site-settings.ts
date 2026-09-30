import { getPrismaClient } from "@/lib/db/client";
import { DEFAULT_COLOR_PALETTE_ID } from "@/lib/color-palettes";
import type { ShippingSettings } from "@/lib/shipping";

/**
 * Storefront-facing read — separate from src/admin/services/site-settings.service.ts's
 * getActiveColorPalette() the same way lib/catalogue.ts stays separate from the admin services:
 * this one has no write path and quietly falls back to the default rather than throwing, since
 * the root layout calling this can't gracefully show an error page for a colour choice the way a
 * missing product/category can use notFound().
 */
export async function getActiveColorPaletteId(): Promise<string> {
  try {
    const settings = await getPrismaClient().siteSettings.findFirst();
    return settings?.activeColorPalette ?? DEFAULT_COLOR_PALETTE_ID;
  } catch {
    return DEFAULT_COLOR_PALETTE_ID;
  }
}

/**
 * Admin-configured shipping rule. Unlike the palette this throws on a DB error rather than falling
 * back — silently charging £0 shipping because of a transient failure would be a real money bug.
 * A missing row just means nothing has been configured yet: free shipping, same as the defaults.
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
  const settings = await getPrismaClient().siteSettings.findFirst();
  return {
    flatPence: settings?.shippingFlatPence ?? 0,
    freeThresholdPence: settings?.freeShippingThresholdPence ?? null,
  };
}

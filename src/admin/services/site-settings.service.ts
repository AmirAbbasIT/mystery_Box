import "server-only";
import { getPrismaClient } from "@/lib/db/client";
import { DEFAULT_COLOR_PALETTE_ID, isValidColorPaletteId } from "@/lib/color-palettes";

/**
 * SiteSettings is a singleton — exactly one row. getOrCreate() below is the only way any code
 * should touch this table, so callers never have to think about "what if the row doesn't exist
 * yet" (fresh database, never configured before).
 */
async function getOrCreateSettings() {
  const prisma = getPrismaClient();
  const existing = await prisma.siteSettings.findFirst();
  if (existing) return existing;

  return prisma.siteSettings.create({ data: { activeColorPalette: DEFAULT_COLOR_PALETTE_ID } });
}

export async function getActiveColorPalette(): Promise<string> {
  const settings = await getOrCreateSettings();
  return settings.activeColorPalette;
}

export async function setActiveColorPalette(paletteId: string): Promise<void> {
  if (!isValidColorPaletteId(paletteId)) {
    throw new Error(`Unknown colour palette: ${paletteId}`);
  }

  const settings = await getOrCreateSettings();
  await getPrismaClient().siteSettings.update({
    where: { id: settings.id },
    data: { activeColorPalette: paletteId },
  });
}

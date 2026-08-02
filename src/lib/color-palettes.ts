/**
 * The fixed set of selectable colour palettes — admin picks one via /admin/settings, applied
 * site-wide via a `data-color-theme` attribute on <html> (see src/app/layout.tsx and
 * src/styles/themes/_palettes.scss). Not a full theme editor: these are curated presets — only
 * which one is active is admin-editable, not the hex values themselves. Deliberately distinct hue
 * families (pink/blue/green/orange), not near-identical variations — an earlier version of this
 * list was all pink/purple shades and was hard to tell apart at a glance. No yellow/gold option:
 * accent (#ffd166) is the constant "win moment" colour across every palette (see
 * 04-design-system.md), and a gold-family palette would visually compete with that signal.
 * Adding a new preset means adding both an entry here (for the admin picker's id/name/swatch) and
 * a matching SCSS override block.
 */

export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  /** Swatch preview only — the real values live in src/styles/themes/_palettes.scss. */
  swatch: { primary: string; secondary: string; accent: string };
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: "blush-rose",
    name: "Blush Rose",
    description: "The original — warm pink primary, lilac secondary.",
    swatch: { primary: "#ff6fa5", secondary: "#9b5de5", accent: "#ffd166" },
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    description: "Cool and fresh — sky blue primary, teal-cyan secondary.",
    swatch: { primary: "#3d8bfd", secondary: "#22b8cf", accent: "#ffd166" },
  },
  {
    id: "meadow-green",
    name: "Meadow Green",
    description: "Natural and calm — leaf green primary, teal-green secondary.",
    swatch: { primary: "#38b26a", secondary: "#22b8a0", accent: "#ffd166" },
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    description: "Warm and energetic — vivid orange primary, coral secondary.",
    swatch: { primary: "#ff8a3d", secondary: "#ff5e7e", accent: "#ffd166" },
  },
];

export const DEFAULT_COLOR_PALETTE_ID = "blush-rose";

export function isValidColorPaletteId(id: string): boolean {
  return COLOR_PALETTES.some((palette) => palette.id === id);
}

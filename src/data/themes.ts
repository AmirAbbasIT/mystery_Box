import type { Theme } from "@/types";

// Original, non-licensed themes — deliberately avoids trademarked character
// names (Hello Kitty, Kuromi, Disney, etc. from the old site's copy) since
// selling boxes "themed" around third-party IP without a license is a real
// legal exposure. These evoke the same aesthetics safely.
export const themes: Theme[] = [
  {
    id: "theme-kawaii-pastels",
    slug: "kawaii-pastels",
    name: "Kawaii Pastels",
    colorSwatch: "#ffc2dd",
    description: "Soft pastel, cute-core pieces — for the girls who love all things adorable.",
  },
  {
    id: "theme-y2k-sparkle",
    slug: "y2k-sparkle",
    name: "Y2K Sparkle",
    colorSwatch: "#c6a6f2",
    description: "Butterfly clips, glitter and 2000s nostalgia.",
  },
  {
    id: "theme-cottagecore-florals",
    slug: "cottagecore-florals",
    name: "Cottagecore Florals",
    colorSwatch: "#ffd166",
    description: "Pressed flowers, gingham and soft romantic details.",
  },
  {
    id: "theme-celestial-stars",
    slug: "celestial-stars",
    name: "Celestial & Stars",
    colorSwatch: "#7a3dc2",
    description: "Moons, stars and celestial charms for dreamers.",
  },
  {
    id: "theme-retro-cartoon",
    slug: "retro-cartoon",
    name: "Retro Cartoon",
    colorSwatch: "#ff6fa5",
    description: "Bold, playful cartoon-inspired colours and shapes.",
  },
  {
    id: "theme-unicorn-dreams",
    slug: "unicorn-dreams",
    name: "Unicorn Dreams",
    colorSwatch: "#e14d82",
    description: "Rainbow brights and unicorn magic — a firm kids' favourite.",
  },
];

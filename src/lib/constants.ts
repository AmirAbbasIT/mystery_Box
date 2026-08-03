export const SITE_NAME = "Mystery Packed Gifts";
export const SITE_TAGLINE = "Surprise gift boxes, eggs & wheel spin prizes";

// TODO: replace with the real inbox before launch.
export const CONTACT_EMAIL = "hello@mysteryboxuk.example";

export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: "Shop", href: "/shop" },
  { label: "Mystery Eggs", href: "/mystery-eggs" },
  { label: "Wheel Spin", href: "/wheel-spin" },
  { label: "Birthday Packages", href: "/birthday-packages" },
  { label: "Custom Request", href: "/custom-request" },
  { label: "Seasonal", href: "/seasonal" },
  { label: "About & Contact", href: "/about" },
];

export const FOOTER_LINKS: NavLink[] = [
  { label: "About & Contact", href: "/about" },
  { label: "Legal Notice", href: "/legal-notice" },
];

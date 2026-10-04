export const SITE_NAME = "Mystery Packed Gifts";
export const SITE_TAGLINE = "Surprise gift boxes, eggs & wheel spin prizes";

// TODO: replace with the real inbox before launch.
export const CONTACT_EMAIL = "hello@mysteryboxuk.example";

// TODO: fill in before launch — order confirmation emails must show the trader's legal name and
// geographic address (Consumer Contracts Regulations 2013). Sole trader: your own name trading as
// the shop name; limited company: the registered company name.
export const BUSINESS_LEGAL_NAME = "Mystery Packed Gifts";
export const BUSINESS_ADDRESS = "[Business address — set in src/lib/constants.ts]";

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
  { label: "Track your order", href: "/track" },
  { label: "About & Contact", href: "/about" },
  { label: "Legal Notice", href: "/legal-notice" },
];

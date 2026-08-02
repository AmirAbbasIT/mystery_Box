export const SITE_NAME = "Mystery Box UK";
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
  { label: "Seasonal", href: "/seasonal" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

export const FOOTER_LINKS: NavLink[] = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Legal Notice", href: "/legal-notice" },
];

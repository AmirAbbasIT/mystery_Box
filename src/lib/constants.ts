export const SITE_NAME = "Mystery Picked Gifts";
export const SITE_TAGLINE = "Surprise gift boxes, eggs & wheel spin prizes";

// Shop contact address: shown in the footer, About page, Legal Notice and order emails. Should
// match EMAIL_REPLY_TO in the deployment env so customer replies land in the same inbox.
export const CONTACT_EMAIL = "mysterypickedgifts26@gmail.com";

// Trader identity, shown on the Legal Notice page, in order confirmation emails and in search
// engine data. Legally required: a sole trader using a business name must show their own name and
// a geographic address (Companies Act 2006 business-names rules; Consumer Contracts Regulations
// 2013; E-Commerce Regulations 2002).
export const BUSINESS_OWNER_NAME = "Kerry Michell";
export const BUSINESS_LEGAL_NAME = `${BUSINESS_OWNER_NAME} trading as ${SITE_NAME}`;
export const BUSINESS_POSTAL_ADDRESS = {
  street: "351 Bowthorpe Road",
  town: "Norwich",
  county: "Norfolk",
  postcode: "NR5 8AF",
  country: "GB",
} as const;
export const BUSINESS_ADDRESS = `${BUSINESS_POSTAL_ADDRESS.street}, ${BUSINESS_POSTAL_ADDRESS.town}, ${BUSINESS_POSTAL_ADDRESS.county} ${BUSINESS_POSTAL_ADDRESS.postcode}`;

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

import type { Metadata } from "next";
import { BUSINESS_ADDRESS, CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";

/**
 * SEO helpers shared by every public page, robots.ts and sitemap.ts.
 *
 * Canonical URLs are set per page (never in the root layout — a layout-level canonical would be
 * inherited by every page that forgot its own, pointing them all at the home page).
 */

/**
 * Public origin, no trailing slash. SITE_URL in production; on Vercel previews it falls back to
 * the project's production domain so canonicals never point at a throwaway preview URL.
 */
export function getSiteUrl(): string {
  const configured =
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return configured.replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

interface PageMetadataInput {
  /** Becomes "<title> | Mystery Packed Gifts" via the root layout's title template. */
  title?: string;
  description: string;
  /** Site-relative path of this page, e.g. "/shop/halloween". */
  path: string;
  /** Private pages (basket, checkout): kept out of search results. */
  noIndex?: boolean;
}

/** Served by the app/opengraph-image.jpg file convention. */
const SHARE_IMAGE = { url: "/opengraph-image.jpg", alt: SITE_NAME };

/**
 * Standard metadata for a public page: title, description, canonical URL, Open Graph and Twitter.
 * The share image is listed explicitly: Next only adds app/opengraph-image.jpg automatically
 * until a page sets its own openGraph, which every page using this helper does.
 */
export function pageMetadata({
  title,
  description,
  path,
  noIndex,
}: PageMetadataInput): Metadata {
  const ogTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_GB",
      url: path,
      title: ogTitle,
      description,
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [SHARE_IMAGE.url],
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Serialises JSON-LD safely for a <script> tag (escapes "<" so content can't close the tag). */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Business identity for search engines. The address is left out until a real one is set. */
export function organizationJsonLd(): object {
  const hasAddress = !BUSINESS_ADDRESS.startsWith("[");
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": absoluteUrl("/#organization"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/images/brand/logo.jpg"),
    email: CONTACT_EMAIL,
    areaServed: "GB",
    currenciesAccepted: "GBP",
    ...(hasAddress ? { address: BUSINESS_ADDRESS } : {}),
  };
}

export function websiteJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    inLanguage: "en-GB",
    publisher: { "@id": absoluteUrl("/#organization") },
  };
}

export function breadcrumbJsonLd(crumbs: Array<{ name: string; path: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * /robots.txt. Admin and API routes are never crawled. Admin also carries noindex metadata + an
 * X-Robots-Tag header (next.config.ts), since robots.txt is only advisory.
 *
 * Basket/checkout are deliberately NOT disallowed here: they're linked from every page, and a
 * disallowed URL can still be indexed (without content) because the crawler never gets to see its
 * noindex tag. Letting them be crawled means the noindex in their metadata is seen and honoured.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

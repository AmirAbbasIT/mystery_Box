import { serializeJsonLd } from "@/lib/seo";

/** Structured data for search engines — server-rendered, not executed by the browser. */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";

// Everything under /admin (login included) is kept out of search engines: robots.txt disallows
// crawling, this adds noindex/nofollow to every page, and next.config.ts sends the same as an
// X-Robots-Tag header (which also covers redirects and non-HTML responses).
export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children;
}

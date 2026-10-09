import path from "path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Script/frame/connect origins are limited to our own and PayPal's (the checkout buttons load
// PayPal's JS SDK and render in PayPal iframes). 'unsafe-inline' is needed without nonces, which
// would force every page to render dynamically — see the bundled Next docs'
// content-security-policy guide. Supabase is only for the admin's raw <img> previews.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://*.paypal.com https://*.paypalobjects.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.paypal.com https://*.paypalobjects.com",
  "font-src 'self'",
  "connect-src 'self' https://*.paypal.com",
  "frame-src https://*.paypal.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.paypal.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Never index admin or API responses, even if a URL leaks somewhere crawlable.
        source: "/(admin|api)(.*)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  async redirects() {
    return [
      // /contact merged into /about (About & Contact) — see .claude/docs/08-features.md.
      { source: "/contact", destination: "/about", permanent: true },
    ];
  },
  images: {
    // Supabase Storage public URLs — product/category images uploaded via the admin panel's
    // ImagePicker (src/admin/components/ImagePicker/). See .claude/docs/09-database-schema.md.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;

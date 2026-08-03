import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      // /contact merged into /about (About & Contact) — see claude/08-features.md.
      { source: "/contact", destination: "/about", permanent: true },
    ];
  },
  images: {
    // Supabase Storage public URLs — product/category images uploaded via the admin panel's
    // ImagePicker (src/admin/components/ImagePicker/). See claude/09-database-schema.md.
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

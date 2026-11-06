import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Product photos uploaded in the Stripe dashboard
      { protocol: "https", hostname: "files.stripe.com" },
      { protocol: "https", hostname: "*.stripe.com" },
    ],
  },
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

/**
 * Dev only: let phones and other computers on your Wi-Fi open `npm run dev`
 * (e.g. http://192.168.1.20:3000). Without this, Next blocks its dev scripts
 * for any address other than localhost and nothing on the page responds to taps.
 * Add more with ALLOWED_DEV_ORIGINS=host1,host2 in .env.local.
 */
const privateNetworks = [
  "192.168.*.*",
  "10.*.*.*",
  ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.*.*`),
  "*.local",
];

const nextConfig: NextConfig = {
  allowedDevOrigins: [...privateNetworks, ...(process.env.ALLOWED_DEV_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [])],
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

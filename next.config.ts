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

/** Tunnels for testing on other devices or sharing a preview (ngrok, Cloudflare, localtunnel). */
const tunnels = ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.app", "*.ngrok.dev", "*.ngrok.io", "*.trycloudflare.com", "*.loca.lt"];
const extraOrigins = process.env.ALLOWED_DEV_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  allowedDevOrigins: [...privateNetworks, ...tunnels, ...extraOrigins],
  experimental: {
    // Forms (logins, admin saves) submitted through a tunnel whose host header is rewritten.
    serverActions: { allowedOrigins: process.env.NODE_ENV === "production" ? extraOrigins : [...tunnels, ...extraOrigins] },
  },
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

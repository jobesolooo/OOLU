import type { Metadata, Viewport } from "next";
import { ViewTransition } from "react";
import { RevealObserver } from "@/components/Reveal";
import "./globals.css";
import { site } from "@/lib/site";
import { shippingConfig } from "@/lib/shipping";
import { getSettings } from "@/lib/settings";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { NewsletterPopup } from "@/components/Newsletter";
import { AccountSync } from "@/components/auth/AccountSync";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${site.name} | ${site.motto} — T-shirts, tanks & tracksuits from Amsterdam`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: { siteName: site.name, type: "website", images: ["/images/brand/hero.jpg"] },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#060606" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: SITE_URL,
    logo: `${SITE_URL}/images/brand/logo.png`,
    sameAs: Object.values(site.social),
  };
  return (
    <html lang="en">
      <body id="top" className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          <ViewTransition>{children}</ViewTransition>
        </main>
        <Footer />
        <AccountSync />
        <RevealObserver />
        <CartDrawer freeShippingThreshold={shippingConfig().freeShippingThreshold} />
        {settings.popup.enabled && <NewsletterPopup percentOff={settings.popup.percentOff} delaySeconds={settings.popup.delaySeconds} />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </body>
    </html>
  );
}

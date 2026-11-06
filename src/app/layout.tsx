import type { Metadata, Viewport } from "next";
import { ViewTransition } from "react";
import { RevealObserver } from "@/components/Reveal";
import { PrefsProvider } from "@/components/Prefs";
import { getLocale, getT } from "@/i18n/server";
import { intlLocale } from "@/i18n/config";
import { dictionaries } from "@/i18n/messages";
import { getCurrency, getRates } from "@/lib/rates";
import "./globals.css";
import { site } from "@/lib/site";
import { shippingConfig } from "@/lib/shipping";
import { getSettings } from "@/lib/settings";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { StoreOnly } from "@/components/StoreOnly";
import { NewsletterPopup } from "@/components/Newsletter";
import { AccountSync } from "@/components/auth/AccountSync";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getT();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("meta.default", { name: site.name }), template: `%s | ${site.name}` },
    description: t("brand.description"),
    openGraph: { siteName: site.name, type: "website", images: ["/images/brand/hero.jpg"], locale: intlLocale(locale).replace("-", "_") },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = { themeColor: "#060606", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [settings, locale, currency, rates] = await Promise.all([getSettings(), getLocale(), getCurrency(), getRates()]);
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: SITE_URL,
    logo: `${SITE_URL}/images/brand/logo.png`,
    sameAs: Object.values(site.social),
  };
  return (
    <html lang={locale}>
      <body id="top" className="flex min-h-dvh flex-col">
        <PrefsProvider locale={locale} messages={dictionaries[locale]} currency={currency} rates={rates}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">
          {dictionaries[locale]["a11y.skip"]}
        </a>
        <StoreOnly>
          <Header />
        </StoreOnly>
        <main id="main" className="flex-1">
          <ViewTransition>{children}</ViewTransition>
        </main>
        <StoreOnly>
          <Footer />
        </StoreOnly>
        <AccountSync />
        <RevealObserver />
        <StoreOnly>
          <CartDrawer freeShippingThreshold={shippingConfig().freeShippingThreshold} />
          {settings.popup.enabled && <NewsletterPopup percentOff={settings.popup.percentOff} delaySeconds={settings.popup.delaySeconds} />}
        </StoreOnly>
        </PrefsProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </body>
    </html>
  );
}

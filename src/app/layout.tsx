import type { Metadata, Viewport } from "next";
import { Suspense, ViewTransition } from "react";
import { RevealObserver } from "@/components/Reveal";
import { PrefsProvider } from "@/components/Prefs";
import { getLocale, getT } from "@/i18n/server";
import { intlLocale } from "@/i18n/config";
import { dictionaries } from "@/i18n/messages";
import { getCurrency, getRates } from "@/lib/rates";
import "./globals.css";
import { shippingConfig } from "@/lib/shipping";
import { getSettings } from "@/lib/settings";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { StoreOnly } from "@/components/StoreOnly";
import { Analytics } from "@/components/Analytics";
import { NewsletterPopup } from "@/components/Newsletter";
import { AccountSync } from "@/components/auth/AccountSync";
import { siteUrl } from "@/lib/site-url";
import { getBusiness } from "@/lib/business";
import { ORG_ID, WEBSITE_ID, ldJson, returnPolicy } from "@/lib/seo";

const SITE_URL = siteUrl();

/**
 * Night mode by the visitor's own clock. Dark from dusk to morning, following the season
 * (roughly Amsterdam's evenings: from 17:00 in December, from 22:00 in June).
 * Re-checked every minute so an open tab switches by itself. ?theme=dark / ?theme=light previews either.
 */
const NIGHT_SCRIPT = `(function(){
  var d=document.documentElement, DUSK=[17,18,19,20,21,22,22,21,20,19,17,17], DAWN=[8,8,7,7,6,5,5,6,7,7,8,8];
  var q=(location.search.match(/[?&]theme=(dark|light)/)||[])[1];
  function apply(first){
    var n=new Date(), h=n.getHours()+n.getMinutes()/60, m=n.getMonth();
    var t=q||((h>=DUSK[m]||h<DAWN[m])?"dark":"light");
    if(d.getAttribute("data-theme")===t) return;
    if(!first){d.classList.add("theme-fade");setTimeout(function(){d.classList.remove("theme-fade")},700);}
    d.setAttribute("data-theme",t);
    var meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute("content",t==="dark"?"#0e0e12":"#060606");
  }
  apply(true); setInterval(apply,60000);
  document.addEventListener("visibilitychange",function(){ if(!document.hidden) apply(); });
})();`;

export async function generateMetadata(): Promise<Metadata> {
  const [{ t, locale }, b] = await Promise.all([getT(), getBusiness()]);
  const description = b.description ?? t("brand.description");
  // No canonical here: every page sets its own (see pageMeta), otherwise they'd all point to the homepage.
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("meta.default", { name: b.name }), template: `%s | ${b.name}` },
    description,
    applicationName: b.name,
    authors: [{ name: b.name, url: SITE_URL }],
    creator: b.name,
    publisher: b.legalName || b.name,
    category: "fashion",
    openGraph: { siteName: b.name, type: "website", images: ["/images/brand/hero.jpg"], locale: intlLocale(locale).replace("-", "_"), description },
    twitter: { card: "summary_large_image", images: ["/images/brand/hero.jpg"] },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    verification: {
      ...(b.googleVerify ? { google: b.googleVerify } : {}),
      ...(b.bingVerify ? { other: { "msvalidate.01": b.bingVerify } } : {}),
    },
    formatDetection: { telephone: false, address: false, email: false },
  };
}

export const viewport: Viewport = { themeColor: "#060606", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [settings, locale, currency, rates, b] = await Promise.all([getSettings(), getLocale(), getCurrency(), getRates(), getBusiness()]);
  // Who the shop is (name + logo in Google, the knowledge panel) and the site itself (site name in results).
  const sameAs = Object.values(b.social).filter(Boolean);
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "OnlineStore"],
        "@id": ORG_ID(),
        name: b.name,
        ...(b.legalName ? { legalName: b.legalName } : {}),
        alternateName: [`${b.name} Clothing`, `${b.name} Amsterdam`],
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/images/brand/logo.png` },
        image: `${SITE_URL}/images/brand/hero.jpg`,
        description: b.description ?? dictionaries[locale]["brand.description"],
        ...(sameAs.length ? { sameAs } : {}),
        ...(b.address
          ? { address: { "@type": "PostalAddress", streetAddress: b.address, addressLocality: b.city ?? "Amsterdam", addressCountry: "NL" } }
          : { location: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: b.city ?? "Amsterdam", addressCountry: "NL" } } }),
        ...(b.vat ? { vatID: b.vat } : {}),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: b.email,
          ...(b.phone ? { telephone: b.phone } : {}),
          availableLanguage: ["English", "Dutch", "French", "Spanish", "Italian", "Portuguese"],
        },
        hasMerchantReturnPolicy: returnPolicy(b),
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID(),
        name: b.name,
        alternateName: [`${b.name} Clothing`, `${b.name.toLowerCase()}clothing`, SITE_URL.replace(/^https?:\/\//, "")],
        url: SITE_URL,
        inLanguage: ["en", "nl", "fr", "es", "it", "pt"],
        publisher: { "@id": ORG_ID() },
        potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` }, "query-input": "required name=search_term_string" },
      },
    ],
  };
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Before first paint, so night visitors never see a white flash. */}
        <script dangerouslySetInnerHTML={{ __html: NIGHT_SCRIPT }} />
      </head>
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
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <RevealObserver />
        <StoreOnly>
          <CartDrawer freeShippingThreshold={(await shippingConfig()).freeShippingThreshold} />
          {settings.popup.enabled && <NewsletterPopup percentOff={settings.popup.percentOff} delaySeconds={settings.popup.delaySeconds} />}
        </StoreOnly>
        </PrefsProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(siteJsonLd)} />
      </body>
    </html>
  );
}

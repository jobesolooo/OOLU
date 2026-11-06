/**
 * Legal page TEMPLATES for an EU (Netherlands) based webshop.
 * They are a starting point, not legal advice: fill in every [bracketed] value
 * and have them checked before going live.
 */
export const COMPANY = {
  name: "[Legal company name]",
  tradeName: "Wstablished",
  address: "[Street + number], [Postcode] [City], Netherlands",
  kvk: "[KvK number]",
  vat: "[VAT / BTW number]",
  email: "[support@yourdomain.com]",
  phone: "[Phone number]",
};

export type LegalPage = { title: string; updated: string; sections: { h: string; p: string[] }[] };

const C = COMPANY;

export const LEGAL: Record<string, LegalPage> = {
  privacy: {
    title: "Privacy policy",
    updated: "2026-11-06",
    sections: [
      { h: "Who we are", p: [`${C.tradeName} is operated by ${C.name}, ${C.address} (KvK ${C.kvk}). We are the controller of your personal data under the GDPR. Contact: ${C.email}.`] },
      {
        h: "What we collect and why",
        p: [
          "Orders: name, email, shipping address, phone number and order details — to deliver your order and provide customer service (performance of a contract).",
          "Account: name, email and a hashed password — to give you order history and faster returns (contract).",
          "Newsletter: your email address — to send drops and offers, only with your consent. You can unsubscribe at any time.",
          "Reviews, contact messages and stock alerts: the details you submit — to publish your review, answer your question or email you when an item is available (consent / legitimate interest).",
          "Payments are processed by Stripe. We never receive or store your full card details.",
        ],
      },
      {
        h: "Who we share it with",
        p: [
          "Stripe (payments), Resend (transactional email), our hosting and database providers, and the shipping carrier delivering your order. Each processes data only on our instructions.",
          "Some providers are based outside the EEA; transfers are covered by the EU Standard Contractual Clauses or an adequacy decision.",
        ],
      },
      { h: "How long we keep it", p: ["Order and invoice data: 7 years (Dutch tax law). Account data: until you delete your account. Newsletter: until you unsubscribe."] },
      { h: "Your rights", p: [`You can request access, correction, deletion, restriction, portability, or object to processing by emailing ${C.email}. You may also complain to the Autoriteit Persoonsgegevens.`] },
    ],
  },
  terms: {
    title: "Terms & conditions",
    updated: "2026-11-06",
    sections: [
      { h: "About these terms", p: [`These terms apply to every order placed on this website with ${C.name} (${C.tradeName}), ${C.address}, KvK ${C.kvk}, VAT ${C.vat}.`] },
      { h: "Orders and contract", p: ["A contract is formed when you receive our order confirmation email. We may cancel an order in case of an obvious pricing error or suspected fraud, and will refund any payment in full."] },
      { h: "Prices and payment", p: ["Prices are shown in the currency displayed at checkout and include VAT where applicable. Shipping costs are shown before you pay. Payment is processed securely by Stripe."] },
      { h: "Delivery", p: ["We aim to ship within 1–2 business days. Delivery estimates are indicative. Risk passes to you on delivery."] },
      { h: "Right of withdrawal", p: ["Consumers in the EU may withdraw from a purchase within 14 days of receiving the goods without giving a reason. See our returns policy for how — we offer an extended window."] },
      { h: "Warranty", p: ["You have the statutory rights that apply to consumer purchases. Contact us if something arrives damaged or faulty."] },
      { h: "Gift cards and promotions", p: ["Gift cards can't be exchanged for cash. Discount codes are single-use unless stated and can't be combined unless stated."] },
      { h: "Governing law", p: ["Dutch law applies. This does not affect any mandatory consumer protection in your country of residence. EU consumers may also use the ODR platform: https://ec.europa.eu/odr."] },
    ],
  },
  cookies: {
    title: "Cookie policy",
    updated: "2026-11-06",
    sections: [
      {
        h: "What we use",
        p: [
          "We only use functional cookies and browser storage that the site needs to work: a session cookie to keep you signed in, and local storage for your bag, wishlist and recently viewed items.",
          "These don't track you across sites and don't require consent under Dutch law. Stripe sets its own cookies on the checkout page to prevent fraud.",
        ],
      },
      { h: "Analytics and marketing", p: ["We don't use analytics or advertising cookies. If that changes, we'll ask for your consent first and update this page."] },
    ],
  },
  returns: {
    title: "Returns & refund policy",
    updated: "2026-11-06",
    sections: [
      { h: "Return window", p: ["You can return unworn, unwashed items with original tags within 30 days of delivery. This includes your 14-day statutory right of withdrawal."] },
      { h: "How to return", p: ["Start a return from your account or the order tracking page. Once approved, we'll email the return address. Pack the items securely with your order number inside."] },
      { h: "Return shipping", p: ["Return shipping costs are paid by the customer unless the item is faulty or we sent the wrong item."] },
      { h: "Refunds", p: ["We refund to the original payment method within 14 days of receiving your return, including original standard shipping costs if you return the full order within 14 days."] },
      { h: "Exceptions", p: ["Gift cards and items marked final sale can't be returned. Faulty items are covered by your statutory rights."] },
    ],
  },
  imprint: {
    title: "Imprint",
    updated: "2026-11-06",
    sections: [
      {
        h: "Company details",
        p: [
          `${C.name}, trading as ${C.tradeName}`,
          C.address,
          `Chamber of Commerce (KvK): ${C.kvk}`,
          `VAT (BTW): ${C.vat}`,
          `Email: ${C.email} · Phone: ${C.phone}`,
        ],
      },
    ],
  },
};

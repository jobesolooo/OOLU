import "server-only";
import { randomBytes } from "node:crypto";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "./stripe";

const WELCOME_COUPON_PREFIX = "wst-welcome-";

export function randomCode(prefix: string, length = 6) {
  // Unambiguous characters only (no 0/O, 1/I)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return `${prefix}${out}`;
}

async function ensureWelcomeCoupon(percentOff: number) {
  const stripe = getStripe();
  const id = `${WELCOME_COUPON_PREFIX}${percentOff}`;
  try {
    return await stripe.coupons.retrieve(id);
  } catch {
    return stripe.coupons.create({ id, percent_off: percentOff, duration: "once", name: `Welcome ${percentOff}% off` });
  }
}

/** Single-use, first-order-only welcome code for a new subscriber. Returns null when Stripe isn't set up. */
export async function createWelcomeCode(email: string, percentOff: number) {
  if (!isStripeConfigured()) return null;
  const coupon = await ensureWelcomeCoupon(percentOff);
  const promo = await getStripe().promotionCodes.create({
    promotion: { type: "coupon", coupon: coupon.id },
    code: randomCode("WELCOME-"),
    max_redemptions: 1,
    restrictions: { first_time_transaction: true },
    metadata: { email, source: "newsletter" },
  });
  return promo.code;
}

export type PromoInput = {
  code: string;
  kind: "percent" | "amount";
  value: number; // percent (1-100) or dollars
  maxRedemptions?: number;
  expiresAt?: Date;
  minimumAmount?: number; // dollars
  firstOrderOnly?: boolean;
  currency: string;
};

export async function createPromotion(input: PromoInput) {
  const stripe = getStripe();
  const coupon = await stripe.coupons.create({
    duration: "once",
    name: input.code,
    ...(input.kind === "percent"
      ? { percent_off: input.value }
      : { amount_off: Math.round(input.value * 100), currency: input.currency }),
  });
  return stripe.promotionCodes.create({
    promotion: { type: "coupon", coupon: coupon.id },
    code: input.code,
    ...(input.maxRedemptions ? { max_redemptions: input.maxRedemptions } : {}),
    ...(input.expiresAt ? { expires_at: Math.floor(input.expiresAt.getTime() / 1000) } : {}),
    restrictions: {
      first_time_transaction: Boolean(input.firstOrderOnly),
      ...(input.minimumAmount
        ? { minimum_amount: Math.round(input.minimumAmount * 100), minimum_amount_currency: input.currency }
        : {}),
    },
    metadata: { source: "admin" },
  });
}

export async function listPromotions(): Promise<Stripe.PromotionCode[]> {
  const res = await getStripe().promotionCodes.list({ limit: 100, expand: ["data.promotion.coupon"] });
  return res.data.filter((p) => p.metadata?.source !== "newsletter");
}

export async function setPromotionActive(id: string, active: boolean) {
  await getStripe().promotionCodes.update(id, { active });
}

/** One-off coupon used to apply a gift card balance to a single checkout. */
export async function createGiftCardCoupon(amountOff: number, currency: string, last4: string) {
  return getStripe().coupons.create({
    amount_off: amountOff,
    currency,
    duration: "once",
    max_redemptions: 1,
    name: `Gift card ••${last4}`,
  });
}

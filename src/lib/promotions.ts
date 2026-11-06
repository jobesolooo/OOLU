import "server-only";
import { randomBytes } from "node:crypto";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "./stripe";

const WELCOME_COUPON_PREFIX = "oolu-welcome-";

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

export async function createPromotion(input: PromoInput, previousUses = 0) {
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
    // When replacing a code, uses so far count towards the new limit.
    ...(input.maxRedemptions ? { max_redemptions: Math.max(1, input.maxRedemptions - previousUses) } : {}),
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

/** Every promotion code in Stripe (active and paused), except personal newsletter welcome codes. */
export async function listPromotions(): Promise<Stripe.PromotionCode[]> {
  const out: Stripe.PromotionCode[] = [];
  for await (const p of getStripe().promotionCodes.list({ limit: 100, expand: ["data.promotion.coupon"] })) {
    if (p.metadata?.source !== "newsletter" && p.metadata?.deleted !== "true") out.push(p);
  }
  return out;
}

export async function getPromotion(id: string) {
  return getStripe().promotionCodes.retrieve(id, { expand: ["promotion.coupon"] });
}

/**
 * Stripe codes can't be edited after creation (only paused), so "editing" a code
 * pauses the old one and creates a fresh one with the same customer-facing code.
 * If creating fails, the old code is switched back on.
 */
export async function replacePromotion(id: string, input: PromoInput) {
  const stripe = getStripe();
  const old = await stripe.promotionCodes.retrieve(id);
  if (old.active) await stripe.promotionCodes.update(id, { active: false });
  try {
    const created = await createPromotion(input, old.times_redeemed);
    await stripe.promotionCodes.update(id, { metadata: { replaced_by: created.id } });
    return created;
  } catch (err) {
    if (old.active) await stripe.promotionCodes.update(id, { active: true });
    throw err;
  }
}

/** Remove a code: switch it off for good and delete its discount (coupon) in Stripe. */
export async function deletePromotion(id: string) {
  const stripe = getStripe();
  const promo = await stripe.promotionCodes.retrieve(id, { expand: ["promotion.coupon"] });
  await stripe.promotionCodes.update(id, { active: false, metadata: { deleted: "true" } });
  const coupon = promo.promotion?.coupon;
  const couponId = typeof coupon === "string" ? coupon : coupon?.id;
  // Only delete coupons this store created for a single code (never the shared welcome coupons).
  if (couponId && !couponId.startsWith(WELCOME_COUPON_PREFIX)) {
    const others = await stripe.promotionCodes.list({ coupon: couponId, active: true, limit: 1 });
    if (!others.data.length) await stripe.coupons.del(couponId).catch(() => {});
  }
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

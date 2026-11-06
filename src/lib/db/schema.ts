import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  jsonb,
  primaryKey,
  index,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  // Null for people who only sign in with Google / Apple.
  passwordHash: text("password_hash"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  sessionVersion: integer("session_version").notNull().default(1),
  role: text("role", { enum: ["customer", "admin"] }).notNull().default("customer"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ORDER_STATUSES = [
  "pending", // checkout started, not paid
  "paid", // payment confirmed by Stripe
  "fulfilled", // packed
  "shipped",
  "delivered",
  "cancelled", // checkout expired / abandoned
  "refunded",
  "partially_refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type ShippingAddress = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  phone?: string | null;
};

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: integer("number").generatedAlwaysAsIdentity({ startWith: 1001 }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email"),
    status: text("status", { enum: ORDER_STATUSES }).notNull().default("pending"),
    currency: text("currency").notNull().default("usd"),
    subtotal: integer("subtotal").notNull().default(0),
    shipping: integer("shipping").notNull().default(0),
    tax: integer("tax").notNull().default(0),
    total: integer("total").notNull().default(0),
    refundedAmount: integer("refunded_amount").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    giftCardId: uuid("gift_card_id"),
    giftCardAmount: integer("gift_card_amount").notNull().default(0),
    stripeSessionId: text("stripe_session_id").unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddress>(),
    trackingCarrier: text("tracking_carrier"),
    trackingNumber: text("tracking_number"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_status_idx").on(t.status)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    priceId: text("price_id").notNull(),
    name: text("name").notNull(),
    size: text("size"),
    quantity: integer("quantity").notNull(),
    unitAmount: integer("unit_amount").notNull(),
    image: text("image"),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

/**
 * Stock per product + size. A product/size with no row is treated as
 * "not tracked" (always available) so new Stripe products sell right away.
 */
export const inventory = pgTable(
  "inventory",
  {
    productId: text("product_id").notNull(),
    size: text("size").notNull().default(""),
    quantity: integer("quantity").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.size] })],
);

/* ── Sign-in with Google / Apple ──────────────────────────── */
export const OAUTH_PROVIDERS = ["google", "apple"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];
export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    provider: text("provider", { enum: OAUTH_PROVIDERS }).notNull(),
    providerUserId: text("provider_user_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerUserId] }), index("oauth_user_idx").on(t.userId)],
);

/* ── One-time tokens: email verification + password reset ── */
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["verify_email", "reset_password"] }).notNull(),
    tokenHash: text("token_hash").notNull().unique(), // sha256 of the token; the raw token only lives in the email
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("auth_tokens_user_idx").on(t.userId)],
);

/* ── Staff sign-in codes (email + 6 digits) ─────────────── */
export const adminCodes = pgTable(
  "admin_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(), // HMAC of the code; the code itself only lives in the email
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("admin_codes_email_idx").on(t.email)],
);

/* ── Wishlist saved to the account (syncs across devices) ── */
export const wishlistItems = pgTable(
  "wishlist_items",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

/** Stripe webhook idempotency: each event is processed once. */
export const processedEvents = pgTable("processed_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── Reviews ─────────────────────────────────────────────── */
export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: text("product_id").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    rating: integer("rating").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    size: text("size"),
    fit: text("fit", { enum: ["small", "true", "large"] }),
    verified: boolean("verified").notNull().default(false),
    status: text("status", { enum: REVIEW_STATUSES }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reviews_product_idx").on(t.productId, t.status), uniqueIndex("reviews_user_product_uq").on(t.userId, t.productId)],
);

/* ── Newsletter ──────────────────────────────────────────── */
export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  promoCode: text("promo_code"),
  source: text("source"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});

/* ── Back-in-stock / drop alerts ─────────────────────────── */
export const stockAlerts = pgTable(
  "stock_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    productId: text("product_id").notNull(),
    size: text("size").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("stock_alerts_uq").on(t.email, t.productId, t.size)],
);

/* ── Gift cards ──────────────────────────────────────────── */
export const giftCards = pgTable("gift_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  initialAmount: integer("initial_amount").notNull(),
  balance: integer("balance").notNull(),
  currency: text("currency").notNull().default("usd"),
  purchaserEmail: text("purchaser_email"),
  recipientEmail: text("recipient_email"),
  recipientName: text("recipient_name"),
  senderName: text("sender_name"),
  message: text("message"),
  stripeSessionId: text("stripe_session_id").unique(),
  status: text("status", { enum: ["pending", "active", "disabled"] }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const giftCardLedger = pgTable("gift_card_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  giftCardId: uuid("gift_card_id")
    .notNull()
    .references(() => giftCards.id, { onDelete: "cascade" }),
  orderId: uuid("order_id"),
  amount: integer("amount").notNull(), // negative = spent, positive = issued/refunded
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── Returns ─────────────────────────────────────────────── */
export const RETURN_STATUSES = ["requested", "approved", "received", "refunded", "rejected"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];
export type ReturnLine = { orderItemId: string; quantity: number };
export const returnRequests = pgTable(
  "return_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    status: text("status", { enum: RETURN_STATUSES }).notNull().default("requested"),
    reason: text("reason").notNull(),
    comment: text("comment"),
    items: jsonb("items").$type<ReturnLine[]>().notNull(),
    refundAmount: integer("refund_amount").notNull().default(0),
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("returns_order_idx").on(t.orderId)],
);

/* ── Contact messages ────────────────────────────────────── */
export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull(),
  orderNumber: text("order_number"),
  message: text("message").notNull(),
  status: text("status", { enum: ["new", "done"] }).notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── Store settings (announcement, next drop, …) ─────────── */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type GiftCard = typeof giftCards.$inferSelect;
export type ReturnRequest = typeof returnRequests.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;

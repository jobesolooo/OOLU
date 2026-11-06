import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  jsonb,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
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
    stripeSessionId: text("stripe_session_id").unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddress>(),
    trackingCarrier: text("tracking_carrier"),
    trackingNumber: text("tracking_number"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
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

/** Stripe webhook idempotency: each event is processed once. */
export const processedEvents = pgTable("processed_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

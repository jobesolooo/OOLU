"use server";

import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { sendContactNotification } from "@/lib/email";

export type ContactState = { ok?: boolean; error?: string } | undefined;

const TOPICS = ["Order question", "Returns", "Product question", "Wholesale / collabs", "Press", "Other"] as const;

const Form = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  topic: z.enum(TOPICS),
  orderNumber: z.string().trim().max(20).optional(),
  message: z.string().trim().min(10, "Your message is a bit short").max(5000),
  website: z.string().max(0).optional(), // honeypot: real people leave this empty
});

export async function sendContact(_: ContactState, form: FormData): Promise<ContactState> {
  const parsed = Form.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const { name, email, topic, orderNumber, message } = parsed.data;
  const record = { name, email, topic, message, orderNumber: orderNumber || null };
  const db = await getDb();
  await db.insert(schema.contactMessages).values(record);
  await sendContactNotification(record);
  return { ok: true };
}

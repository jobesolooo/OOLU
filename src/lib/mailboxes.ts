/**
 * The shop's email addresses. Each is <box>@<email domain> (Admin → Settings → Business details),
 * sends one kind of email, and forwards anything customers write to it to the staff inbox.
 */
export const MAILBOXES = [
  { box: "hello", label: "Customer service", sends: "Welcome, newsletter and back-in-stock emails. Shown on the contact page and footer." },
  { box: "orders", label: "Orders", sends: "Order confirmations, shipping updates and refunds." },
  { box: "returns", label: "Returns", sends: "Return request updates." },
  { box: "gifts", label: "Gift cards", sends: "Gift card emails." },
  { box: "account", label: "Accounts", sends: "Confirm email, password reset, invites and security notices." },
  { box: "studio", label: "Staff alerts", sends: "New-order and contact-form alerts and admin codes, sent to staff only." },
] as const;

export type Mailbox = (typeof MAILBOXES)[number]["box"];

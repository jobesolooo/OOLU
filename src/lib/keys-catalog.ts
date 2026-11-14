/**
 * Every account key / connection detail the staff can manage from Admin → Settings.
 * Shared by the server (validation) and the settings screen (labels, help).
 * Bootstrap secrets (DATABASE_URL, SESSION_SECRET, ADMIN_PASSCODE_HASH) are deliberately
 * NOT here: the site needs them before it can even read this list, so they stay in the host.
 */
export type KeyDef = {
  name: string;
  label: string;
  /** Secrets are write-only: once saved, only a short hint is ever shown. */
  secret: boolean;
  multiline?: boolean;
  placeholder?: string;
  /** Pattern the value must match, with a plain-English message when it doesn't. */
  pattern?: { re: string; message: string };
};

export type KeyGroup = { id: string; title: string; blurb: string; link?: { href: string; label: string }; keys: KeyDef[] };

export const KEY_GROUPS: KeyGroup[] = [
  {
    id: "stripe",
    title: "Stripe (payments)",
    blurb: "Checkout, products, discount codes and refunds. Start with test keys, then swap in live keys when you're ready to take real payments.",
    link: { href: "https://dashboard.stripe.com/apikeys", label: "Stripe → Developers → API keys" },
    keys: [
      {
        name: "STRIPE_SECRET_KEY",
        label: "Secret key",
        secret: true,
        placeholder: "sk_test_… or sk_live_…",
        pattern: { re: "^(sk|rk)_(test|live)_[A-Za-z0-9]{10,}$", message: "A Stripe secret key starts with sk_test_, sk_live_, rk_test_ or rk_live_." },
      },
      {
        name: "STRIPE_WEBHOOK_SECRET",
        label: "Webhook signing secret",
        secret: true,
        placeholder: "whsec_…",
        pattern: { re: "^whsec_[A-Za-z0-9+/=]{10,}$", message: "A webhook signing secret starts with whsec_." },
      },
    ],
  },
  {
    id: "email",
    title: "Email (Resend)",
    blurb: "Sends every email and receives mail for the shop's addresses. Create the API key with Full access (not Sending only), so the shop can also receive and forward mail. The addresses themselves are set under Business details → Email addresses.",
    link: { href: "https://resend.com/api-keys", label: "Resend → API Keys" },
    keys: [
      {
        name: "RESEND_API_KEY",
        label: "API key",
        secret: true,
        placeholder: "re_…",
        pattern: { re: "^re_[A-Za-z0-9_]{10,}$", message: "A Resend API key starts with re_." },
      },
      {
        name: "RESEND_WEBHOOK_SECRET",
        label: "Incoming mail signing secret",
        secret: true,
        placeholder: "Filled in for you by Set up email (Business details)",
        pattern: { re: "^whsec_[A-Za-z0-9+/=]{10,}$", message: "A Resend signing secret starts with whsec_." },
      },
    ],
  },
  {
    id: "google",
    title: "Continue with Google",
    blurb: "The Google button on the sign-in page.",
    link: { href: "https://console.cloud.google.com/apis/credentials", label: "Google Cloud → Credentials" },
    keys: [
      {
        name: "GOOGLE_CLIENT_ID",
        label: "Client ID",
        secret: false,
        placeholder: "…apps.googleusercontent.com",
        pattern: { re: "^[\\w-]+\\.apps\\.googleusercontent\\.com$", message: "A Google client ID ends in .apps.googleusercontent.com." },
      },
      {
        name: "GOOGLE_CLIENT_SECRET",
        label: "Client secret",
        secret: true,
        placeholder: "GOCSPX-…",
        pattern: { re: "^[\\w-]{16,}$", message: "That doesn't look like a Google client secret." },
      },
    ],
  },
  {
    id: "apple",
    title: "Continue with Apple",
    blurb: "The Apple button on the sign-in page. Needs an Apple Developer account.",
    link: { href: "https://developer.apple.com/account/resources/identifiers/list/serviceId", label: "Apple Developer → Identifiers" },
    keys: [
      {
        name: "APPLE_CLIENT_ID",
        label: "Services ID",
        secret: false,
        placeholder: "shop.ooluclothing.signin",
        pattern: { re: "^[A-Za-z0-9.-]{3,}$", message: "The Services ID looks like shop.ooluclothing.signin." },
      },
      {
        name: "APPLE_TEAM_ID",
        label: "Team ID",
        secret: false,
        placeholder: "10 characters",
        pattern: { re: "^[A-Z0-9]{10}$", message: "The Team ID is 10 capital letters and numbers." },
      },
      {
        name: "APPLE_KEY_ID",
        label: "Key ID",
        secret: false,
        placeholder: "10 characters",
        pattern: { re: "^[A-Z0-9]{10}$", message: "The Key ID is 10 capital letters and numbers." },
      },
      {
        name: "APPLE_PRIVATE_KEY",
        label: "Private key (.p8 file contents)",
        secret: true,
        multiline: true,
        placeholder: "-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----",
        pattern: { re: "BEGIN PRIVATE KEY[\\s\\S]+END PRIVATE KEY", message: "Paste the whole .p8 file, including the BEGIN and END lines." },
      },
    ],
  },
  {
    id: "cron",
    title: "Scheduled drops",
    blurb: "Password the scheduler uses to release drops on time.",
    keys: [{ name: "CRON_SECRET", label: "Cron secret", secret: true, placeholder: "at least 16 characters", pattern: { re: "^\\S{16,}$", message: "Use at least 16 characters, no spaces." } }],
  },
];

export const KEY_DEFS: Record<string, KeyDef> = Object.fromEntries(KEY_GROUPS.flatMap((g) => g.keys.map((k) => [k.name, k])));
export type KeyName = keyof typeof KEY_DEFS & string;

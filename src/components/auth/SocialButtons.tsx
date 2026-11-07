import { AppleBrandIcon } from "../icons";
import { getT } from "@/i18n/server";
import { dictionaries, type MessageKey } from "@/i18n/messages";

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}

export function AppleIcon({ className }: { className?: string }) {
  return <AppleBrandIcon className={className} />;
}

/**
 * Plain links (not JS) so they work everywhere and keep the OAuth redirect server-side.
 * A provider that isn't set up yet sends people back with a friendly "not available yet" note.
 */
export async function SocialButtons({ next, mode }: { next?: string; mode: "login" | "register" }) {
  const { t } = await getT();
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <a href={`/api/auth/google${q}`} aria-label={t(mode === "login" ? "auth.continueWith" : "auth.signUpWith", { provider: "Google" })} className="flex h-[clamp(50px,6.6vh,60px)] w-full items-center justify-center gap-3 border border-black/20 bg-white px-4 text-[15px] font-medium transition-colors hover:border-ink">
          <GoogleIcon className="size-5" /> Google
        </a>
        <a href={`/api/auth/apple${q}`} aria-label={t(mode === "login" ? "auth.continueWith" : "auth.signUpWith", { provider: "Apple" })} className="flex h-[clamp(50px,6.6vh,60px)] w-full items-center justify-center gap-3 bg-black px-4 text-[15px] font-medium text-white transition-opacity hover:opacity-85">
          <AppleIcon className="size-5" /> Apple
        </a>
      </div>
      <OrDivider />
    </>
  );
}

export async function OrDivider({ label }: { label?: string }) {
  const { t } = await getT();
  return (
    <div className="my-[clamp(16px,3.4vh,36px)] flex items-center gap-5 text-[11px] tracking-[0.2em] whitespace-nowrap text-ash uppercase">
      <span className="h-px flex-1 bg-black/15" />
      {label ?? t("auth.orEmail")}
      <span className="h-px flex-1 bg-black/15" />
    </div>
  );
}

const ERRORS: Record<string, string> = {
  google_not_configured: "Google sign-in isn't available yet. Use your email for now.",
  apple_not_configured: "Apple sign-in isn't available yet. Use your email for now.",
  cancelled: "Sign-in was cancelled.",
  expired: "That sign-in attempt expired. Please try again.",
  provider_error: "We couldn't complete sign-in with that provider. Please try again.",
  sign_in_first: "Sign in first to connect another login method.",
};

export function authErrorMessage(code: string | undefined, t?: (key: MessageKey) => string) {
  if (!code) return null;
  const key = `auth.err.${code}` as MessageKey;
  if (t && key in dictionaries.en) return t(key);
  return ERRORS[code] ?? code.slice(0, 200);
}

import { AppleBrandIcon } from "../icons";
import { getT } from "@/i18n/server";
import { dictionaries, type MessageKey } from "@/i18n/messages";
import { customerProviders } from "@/lib/oauth";

import { GoogleIcon } from "./GoogleIcon";
export { GoogleIcon };

export function AppleIcon({ className }: { className?: string }) {
  return <AppleBrandIcon className={className} />;
}

/**
 * Plain links (not JS) so they work everywhere and keep the OAuth redirect server-side.
 * Only the providers switched on in Admin → Settings (and set up with keys) are shown;
 * with none, the email form stands on its own (no "or" divider).
 */
export async function SocialButtons({ next, mode }: { next?: string; mode: "login" | "register" }) {
  const [{ t }, providers] = await Promise.all([getT(), customerProviders()]);
  if (!providers.length) return null;
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <>
      <div className={`grid gap-3 ${providers.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {providers.includes("google") && (
        <a href={`/api/auth/google${q}`} aria-label={t(mode === "login" ? "auth.continueWith" : "auth.signUpWith", { provider: "Google" })} className="flex h-[clamp(50px,6.6vh,60px)] w-full items-center justify-center gap-3 border border-black/20 bg-white px-4 text-[15px] font-medium transition-colors hover:border-ink">
          <GoogleIcon className="size-5" /> {providers.length === 1 ? t(mode === "login" ? "auth.continueWith" : "auth.signUpWith", { provider: "Google" }) : "Google"}
        </a>
        )}
        {providers.includes("apple") && (
        <a href={`/api/auth/apple${q}`} aria-label={t(mode === "login" ? "auth.continueWith" : "auth.signUpWith", { provider: "Apple" })} className="flex h-[clamp(50px,6.6vh,60px)] w-full items-center justify-center gap-3 bg-black px-4 text-[15px] font-medium text-white transition-opacity hover:opacity-85">
          <AppleIcon className="size-5" /> {providers.length === 1 ? t(mode === "login" ? "auth.continueWith" : "auth.signUpWith", { provider: "Apple" }) : "Apple"}
        </a>
        )}
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

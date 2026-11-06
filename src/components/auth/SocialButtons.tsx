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
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M16.4 12.7c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1ZM13.9 5c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3-1.5Z" />
    </svg>
  );
}

/** Plain links (not JS) so they work everywhere and keep the OAuth redirect server-side. */
export function SocialButtons({ next, mode }: { next?: string; mode: "login" | "register" }) {
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  const verb = mode === "login" ? "Continue" : "Sign up";
  return (
    <div className="space-y-4">
      <a href={`/api/auth/google${q}`} className="flex min-h-[58px] w-full items-center justify-center gap-3 border border-black/20 bg-white px-5 text-[16px] font-medium transition-colors hover:border-ink">
        <GoogleIcon className="size-5" /> {verb} with Google
      </a>
      <a href={`/api/auth/apple${q}`} className="flex min-h-[58px] w-full items-center justify-center gap-3 bg-black px-5 text-[16px] font-medium text-white transition-opacity hover:opacity-85">
        <AppleIcon className="size-5" /> {verb} with Apple
      </a>
    </div>
  );
}

export function OrDivider({ label = "or with email" }: { label?: string }) {
  return (
    <div className="my-9 flex items-center gap-5 text-[11px] tracking-[0.2em] whitespace-nowrap text-ash uppercase">
      <span className="h-px flex-1 bg-black/15" />
      {label}
      <span className="h-px flex-1 bg-black/15" />
    </div>
  );
}

const ERRORS: Record<string, string> = {
  google_not_configured: "Google sign-in isn't set up yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (see README).",
  apple_not_configured: "Apple sign-in isn't set up yet. Add the APPLE_* keys (see README).",
  cancelled: "Sign-in was cancelled.",
  expired: "That sign-in attempt expired. Please try again.",
  provider_error: "We couldn't complete sign-in with that provider. Please try again.",
  sign_in_first: "Sign in first to connect another login method.",
};

export function authErrorMessage(code: string | undefined) {
  if (!code) return null;
  return ERRORS[code] ?? code.slice(0, 200);
}

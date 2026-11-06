import { NextResponse } from "next/server";
import { generateCodeVerifier, generateState } from "arctic";
import { OAUTH_PROVIDERS, type OAuthProvider } from "@/lib/db/schema";
import { apple, google, isProviderConfigured, OAUTH_COOKIE, safeNext, sealFlow } from "@/lib/oauth";
import { getCurrentUser } from "@/lib/auth";

/** Starts "Continue with Google / Apple". ?next=/path to return somewhere, ?link=1 to connect to the signed-in account. */
export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider: raw } = await ctx.params;
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"));
  const provider = OAUTH_PROVIDERS.find((p) => p === raw) as OAuthProvider | undefined;
  if (!provider) return new NextResponse("Not found", { status: 404 });

  const back = (error: string) =>
    NextResponse.redirect(new URL(`/account/login?error=${encodeURIComponent(error)}&next=${encodeURIComponent(next)}`, url));

  if (!isProviderConfigured(provider)) return back(`${provider}_not_configured`);

  let linkUserId: string | undefined;
  if (url.searchParams.get("link") === "1") {
    const user = await getCurrentUser();
    if (!user) return back("sign_in_first");
    linkUserId = user.id;
  }

  const state = generateState();
  let authUrl: URL;
  let verifier: string | undefined;
  if (provider === "google") {
    verifier = generateCodeVerifier();
    authUrl = google().createAuthorizationURL(state, verifier, ["openid", "email", "profile"]);
    authUrl.searchParams.set("prompt", "select_account");
  } else {
    authUrl = apple().createAuthorizationURL(state, ["name", "email"]);
    // Apple only returns name/email when the response is POSTed back.
    authUrl.searchParams.set("response_mode", "form_post");
  }

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(OAUTH_COOKIE, await sealFlow({ provider, state, verifier, next, linkUserId }), {
    httpOnly: true,
    path: "/",
    maxAge: 600,
    // Apple POSTs back from appleid.apple.com, so the cookie must be sent cross-site.
    secure: provider === "apple" || process.env.NODE_ENV === "production",
    sameSite: provider === "apple" ? "none" : "lax",
  });
  return res;
}

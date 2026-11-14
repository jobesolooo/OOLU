import { NextResponse } from "next/server";
import { generateCodeVerifier, generateState } from "arctic";
import { OAUTH_PROVIDERS, type OAuthProvider } from "@/lib/db/schema";
import { apple, customerProviders, google, isProviderConfigured, OAUTH_COOKIE, safeNext, sealFlow } from "@/lib/oauth";
import { staffGoogleEmails } from "@/lib/admin-auth";
import { getCurrentUser } from "@/lib/auth";

/**
 * Starts "Continue with Google / Apple". ?next=/path to return somewhere, ?link=1 to connect to the signed-in account,
 * ?staff=1 for the admin panel (Google only, for the accounts listed in Settings → Staff access).
 */
export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider: raw } = await ctx.params;
  const url = new URL(req.url);
  const staff = url.searchParams.get("staff") === "1";
  const wanted = url.searchParams.get("next");
  const next = staff ? (wanted?.startsWith("/admin") && !wanted.startsWith("//") ? wanted : "/admin") : safeNext(wanted);
  const provider = OAUTH_PROVIDERS.find((p) => p === raw) as OAuthProvider | undefined;
  if (!provider) return new NextResponse("Not found", { status: 404 });

  const back = (error: string) =>
    NextResponse.redirect(
      new URL(staff ? `/admin/login?error=${encodeURIComponent(error)}` : `/account/login?error=${encodeURIComponent(error)}&next=${encodeURIComponent(next)}`, url),
    );

  if (staff) {
    if (provider !== "google" || !(await isProviderConfigured("google")) || !(await staffGoogleEmails()).length) return back("staff_google_off");
  } else if (!(await customerProviders()).includes(provider)) return back(`${provider}_not_configured`);

  let linkUserId: string | undefined;
  if (!staff && url.searchParams.get("link") === "1") {
    const user = await getCurrentUser();
    if (!user) return back("sign_in_first");
    linkUserId = user.id;
  }

  const state = generateState();
  let authUrl: URL;
  let verifier: string | undefined;
  if (provider === "google") {
    verifier = generateCodeVerifier();
    authUrl = (await google()).createAuthorizationURL(state, verifier, ["openid", "email", "profile"]);
    authUrl.searchParams.set("prompt", "select_account");
  } else {
    authUrl = (await apple()).createAuthorizationURL(state, ["name", "email"]);
    // Apple only returns name/email when the response is POSTed back.
    authUrl.searchParams.set("response_mode", "form_post");
  }

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(OAUTH_COOKIE, await sealFlow({ provider, state, verifier, next, linkUserId, staff: staff || undefined }), {
    httpOnly: true,
    path: "/",
    maxAge: 600,
    // Apple POSTs back from appleid.apple.com, so the cookie must be sent cross-site.
    secure: provider === "apple" || process.env.NODE_ENV === "production",
    sameSite: provider === "apple" ? "none" : "lax",
  });
  return res;
}

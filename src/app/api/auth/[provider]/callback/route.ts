import { NextResponse } from "next/server";
import { decodeIdToken, OAuth2RequestError } from "arctic";
import { cookies } from "next/headers";
import { OAUTH_PROVIDERS, type OAuthProvider } from "@/lib/db/schema";
import { apple, google, OAUTH_COOKIE, resolveOAuthUser, unsealFlow, type OAuthProfile } from "@/lib/oauth";
import { signIn } from "@/lib/auth";
import { sendWelcome } from "@/lib/email";

type GoogleClaims = { sub: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
type AppleClaims = { sub: string; email?: string; email_verified?: boolean | "true" | "false" };

async function handle(req: Request, provider: OAuthProvider, params: URLSearchParams) {
  const origin = new URL(req.url);
  const jar = await cookies();
  const flow = await unsealFlow(jar.get(OAUTH_COOKIE)?.value);
  const next = flow?.next ?? "/account";

  const fail = (error: string) => {
    const target = flow?.linkUserId ? `/account/settings?error=${encodeURIComponent(error)}` : `/account/login?error=${encodeURIComponent(error)}&next=${encodeURIComponent(next)}`;
    const res = NextResponse.redirect(new URL(target, origin), 303);
    res.cookies.delete(OAUTH_COOKIE);
    return res;
  };

  if (params.get("error")) return fail(params.get("error") === "user_cancelled_authorize" || params.get("error") === "access_denied" ? "cancelled" : "provider_error");
  const code = params.get("code");
  const state = params.get("state");
  if (!flow || flow.provider !== provider || !code || !state || state !== flow.state) return fail("expired");

  let profile: OAuthProfile;
  try {
    if (provider === "google") {
      const tokens = await google().validateAuthorizationCode(code, flow.verifier!);
      // The ID token comes straight from Google's token endpoint over TLS, so its claims can be trusted.
      const c = decodeIdToken(tokens.idToken()) as GoogleClaims;
      profile = { provider, sub: c.sub, email: c.email ?? null, emailVerified: c.email_verified === true, name: c.name ?? null, image: c.picture ?? null };
    } else {
      const tokens = await apple().validateAuthorizationCode(code);
      const c = decodeIdToken(tokens.idToken()) as AppleClaims;
      // Apple sends the name only on the very first sign-in, as a JSON form field.
      let name: string | null = null;
      try {
        const u = JSON.parse(params.get("user") ?? "null") as { name?: { firstName?: string; lastName?: string } } | null;
        name = [u?.name?.firstName, u?.name?.lastName].filter(Boolean).join(" ") || null;
      } catch {}
      profile = {
        provider,
        sub: c.sub,
        email: c.email ?? null,
        emailVerified: c.email_verified === true || c.email_verified === "true",
        name,
        image: null,
      };
    }
  } catch (err) {
    console.error(`[auth:${provider}] token exchange failed`, err instanceof OAuth2RequestError ? err.code : err);
    return fail("provider_error");
  }

  const result = await resolveOAuthUser(profile, flow.linkUserId);
  if (!result.ok) return fail(result.error);

  await signIn(result.user);
  if (result.created) await sendWelcome(result.user.email, result.user.name);

  const dest = flow.linkUserId ? `/account/settings?connected=${provider}` : result.created ? `${next}${next.includes("?") ? "&" : "?"}welcome=1` : next;
  const res = NextResponse.redirect(new URL(dest, origin), 303);
  res.cookies.delete(OAUTH_COOKIE);
  return res;
}

function providerOf(raw: string) {
  return OAUTH_PROVIDERS.find((p) => p === raw) as OAuthProvider | undefined;
}

export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const provider = providerOf((await ctx.params).provider);
  if (!provider) return new NextResponse("Not found", { status: 404 });
  return handle(req, provider, new URL(req.url).searchParams);
}

/** Apple uses response_mode=form_post. */
export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const provider = providerOf((await ctx.params).provider);
  if (!provider) return new NextResponse("Not found", { status: 404 });
  const form = await req.formData();
  const params = new URLSearchParams();
  for (const [k, v] of form.entries()) if (typeof v === "string") params.set(k, v);
  return handle(req, provider, params);
}

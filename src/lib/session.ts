import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

/** v = the user's sessionVersion when they signed in; bumping it signs out every device. */
export type SessionData = { userId?: string; v?: number };

function options(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters (see .env.example).");
  }
  return {
    password,
    cookieName: "wst_session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    },
  };
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), options());
}

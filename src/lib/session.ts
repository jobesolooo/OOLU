import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

/** v = the user's sessionVersion when they signed in; bumping it signs out every device. */
/** keysUntil = until when this session may change account keys (after re-entering the staff passcode). */
/** googleStaffAt = when staff last signed in with Google (lets them set a new passcode if they forgot it). */
export type SessionData = { userId?: string; v?: number; keysUntil?: number; googleStaffAt?: number };

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

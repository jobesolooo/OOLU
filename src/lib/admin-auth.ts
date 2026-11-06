import "server-only";
import { scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Staff sign-in: one permanent username + a 6-digit passcode.
 * The passcode is never stored in plain text — only an scrypt hash in ADMIN_PASSCODE_HASH
 * (generate one with `npm run admin:passcode`). Guessing is throttled in actions.ts.
 */
export const adminUsername = () => (process.env.ADMIN_USERNAME ?? "Janna").trim();

export const isPasscodeConfigured = () => Boolean(process.env.ADMIN_PASSCODE_HASH?.startsWith("scrypt:"));

export function checkStaffCredentials(username: string, passcode: string) {
  const stored = process.env.ADMIN_PASSCODE_HASH ?? "";
  const [, saltHex, hashHex] = stored.split(":");
  // Always run the hash, even for a wrong username, so timing doesn't reveal which part was wrong.
  const actual = scryptSync(passcode, Buffer.from(saltHex ?? "00", "hex"), 32);
  const expected = Buffer.from(hashHex ?? "", "hex");
  const codeOk = expected.length === actual.length && timingSafeEqual(expected, actual);
  const nameOk = username.trim().toLowerCase() === adminUsername().toLowerCase();
  return isPasscodeConfigured() && codeOk && nameOk;
}

/** Internal email for the staff account (never receives mail). */
export const staffEmail = () => `${adminUsername().toLowerCase().replace(/[^a-z0-9]+/g, ".")}@staff.oolu`;

/**
 * Generates a new random 6-digit staff passcode and its hash.
 * Put the hash in ADMIN_PASSCODE_HASH (.env.local and your hosting env vars); give the code to staff.
 * Usage: npm run admin:passcode
 */
import { randomBytes, randomInt, scryptSync } from "node:crypto";

let code;
do code = String(randomInt(0, 1_000_000)).padStart(6, "0");
while (/^(\d)\1+$/.test(code) || "0123456789".includes(code) || "9876543210".includes(code)); // skip 000000, 123456…

const salt = randomBytes(16);
const hash = `scrypt:${salt.toString("hex")}:${scryptSync(code, salt, 32).toString("hex")}`; // ":" not "$" — Next.js expands $ in .env files
console.log(`Passcode: ${code}\n\nADMIN_PASSCODE_HASH=${hash}`);

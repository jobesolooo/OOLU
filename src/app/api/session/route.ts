import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/** Minimal "who am I" for client components (header avatar, wishlist sync). */
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(
    { user: user ? { name: user.name, email: user.email, image: user.image, admin: user.role === "admin" } : null },
    { headers: { "Cache-Control": "no-store" } },
  );
}

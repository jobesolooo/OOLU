import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { exportUserData } from "@/lib/account";
import { siteUrl } from "@/lib/site-url";

/** "Download my data": everything stored about the signed-in customer, as JSON. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/account/login?next=/account/privacy", siteUrl()));
  const data = await exportUserData(user.id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="oolu-account-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

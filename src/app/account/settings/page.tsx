import { redirect } from "next/navigation";

/** Old address: sign-in method callbacks and bookmarks land on the new pages. */
export default async function SettingsRedirect({ searchParams }: PageProps<"/account/settings">) {
  const sp = new URLSearchParams(Object.entries(await searchParams).flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : v ? [[k, v]] : [])));
  const q = sp.toString();
  redirect(q ? `/account/security?${q}` : "/account/profile");
}

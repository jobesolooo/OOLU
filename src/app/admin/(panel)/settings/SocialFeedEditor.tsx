"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, ArrowUp } from "lucide-react";
import { AdminForm } from "../FormMessage";
import { saveSocialFeed, uploadSocialPhoto } from "./social-actions";

type Post = { url: string; image: string };

/** Settings → Homepage → Social feed. Instagram: photo + post link per tile. TikTok: one link per line. */
export function SocialFeedEditor({ enabled, instagram, tiktok }: { enabled: boolean; instagram: Post[]; tiktok: string[] }) {
  const [posts, setPosts] = useState<Post[]>(instagram);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setErr(null);
    for (const file of Array.from(files).slice(0, 12 - posts.length)) {
      const fd = new FormData();
      fd.set("photo", file);
      const res = await uploadSocialPhoto(fd);
      if (res.url) setPosts((p) => [...p, { url: "", image: res.url! }]);
      else setErr(res.error ?? "Upload failed.");
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <AdminForm action={saveSocialFeed} submitLabel="Save social feed" className="min-w-0 space-y-4 bg-white p-6 ring-1 ring-black/5">
      <div>
        <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase">Social feed (homepage)</h3>
        <p className="mt-1 text-xs text-ash">
          Two carousels side by side: Instagram on the left, TikTok on the right. Until you add posts, both show the latest shoot photos linking to your profiles.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="socialEnabled" defaultChecked={enabled} /> Show the social feed
      </label>
      <input type="hidden" name="instagram" value={JSON.stringify(posts)} />

      <div className="space-y-2">
        <p className="text-[12px] font-medium">Instagram posts</p>
        <p className="text-[11px] text-ash">Upload the post&apos;s photo, then paste its link (on Instagram: ⋯ → Copy link). Up to 12; the first shows first.</p>
        {posts.length > 0 && (
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
            {posts.map((p, i) => (
              <li key={p.image} className="flex items-center gap-3 bg-mist p-2 ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded file */}
                <img src={p.image} alt="" className="size-14 shrink-0 object-cover" />
                <input
                  value={p.url}
                  onChange={(e) => setPosts((all) => all.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                  placeholder="https://www.instagram.com/p/…"
                  className="input min-w-0 flex-1 !py-2 text-[13px]"
                />
                <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => setPosts((all) => { const n = [...all]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })} className="p-1 disabled:opacity-25">
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" aria-label="Remove" onClick={() => setPosts((all) => all.filter((_, j) => j !== i))} className="p-1 text-red-700">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <label className={`inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-[12px] ring-1 ring-black/15 hover:bg-mist ${busy ? "pointer-events-none opacity-50" : ""}`}>
          <ImagePlus className="size-4" /> {busy ? "Uploading…" : "Add Instagram photos"}
          <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => add(e.target.files)} disabled={posts.length >= 12} />
        </label>
        {err && <p className="text-[12px] text-red-700">{err}</p>}
      </div>

      <label className="block space-y-1">
        <span className="text-[12px] font-medium">TikTok videos</span>
        <span className="block text-[11px] text-ash">One link per line (on TikTok: Share → Copy link). Thumbnails and captions load by themselves.</span>
        <textarea name="tiktok" rows={4} defaultValue={tiktok.join("\n")} placeholder={"https://www.tiktok.com/@oolu263/video/…"} className="input font-mono text-[13px]" />
      </label>
    </AdminForm>
  );
}

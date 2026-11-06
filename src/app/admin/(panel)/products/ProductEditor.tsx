"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Link2, Loader2, Plus, Trash2, X } from "lucide-react";
import { cx } from "@/lib/format";
import { saveProduct, uploadPhoto, type ProductFormState } from "./actions";

export type EditorProduct = {
  id: string;
  name: string;
  description: string;
  price: string;
  compareAt: string;
  slug: string;
  category: string;
  collection: string;
  sizes: string[];
  featured: boolean;
  isNew: boolean;
  sort: string;
  group: string;
  color: string;
  colorHex: string;
  releaseAt: string; // Amsterdam local "YYYY-MM-DDTHH:mm"
  details: string;
  colors: { name: string; hex: string }[];
  images: string[];
  active: boolean;
};

const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "XXL"];

const label = "mb-1.5 block text-[11px] font-semibold tracking-[0.1em] text-black/70 uppercase";
const card = "bg-white p-5 ring-1 ring-black/5 sm:p-6";
const cardTitle = "mb-4 text-[11px] font-semibold tracking-[0.14em] uppercase";

export function ProductEditor({
  product,
  categories,
  collections,
  dashboardUrl,
}: {
  product: EditorProduct;
  categories: string[];
  collections: string[];
  dashboardUrl: string | null;
}) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, undefined);
  const [images, setImages] = useState(product.images);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [sizes, setSizes] = useState(product.sizes);
  const [customSize, setCustomSize] = useState("");
  const [colors, setColors] = useState(product.colors);
  const [price, setPrice] = useState(product.price);
  const [compareAt, setCompareAt] = useState(product.compareAt);
  const [name, setName] = useState(product.name);
  const fileRef = useRef<HTMLInputElement>(null);
  const isNew = !product.id;

  async function addFiles(files: FileList | File[]) {
    setUploadError(null);
    const list = [...files].slice(0, 8 - images.length);
    setUploading((n) => n + list.length);
    await Promise.all(
      list.map(async (f) => {
        const fd = new FormData();
        fd.set("file", f);
        const res = await uploadPhoto(fd);
        if (res.url) setImages((prev) => [...prev, res.url!].slice(0, 8));
        else setUploadError(res.error ?? "Upload failed");
        setUploading((n) => n - 1);
      }),
    );
  }

  const move = (i: number, d: -1 | 1) =>
    setImages((prev) => {
      const next = [...prev];
      const j = i + d;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const toggleSize = (s: string) => setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const sale = Number(compareAt) > Number(price) && Number(price) > 0;
  const err = (f: string) => state?.field === f;

  return (
    <form action={action} className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="colors" value={JSON.stringify(colors.filter((c) => c.name.trim()))} />
      <input type="hidden" name="sizes" value={sizes.join(",")} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
        {/* Basics */}
        <section className={card}>
          <h2 className={cardTitle}>Basics</h2>
          <label className="block">
            <span className={label}>Name</span>
            <input name="name" value={name} onChange={(e) => setName(e.target.value)} required className={cx("input", err("name") && "border-rose-400")} placeholder="OOLU Windbreaker Tracksuit Set — Black" />
          </label>
          <label className="mt-4 block">
            <span className={label}>Description</span>
            <textarea name="description" defaultValue={product.description} rows={5} className="input" placeholder="What it is, how it fits, what it's made of." />
          </label>
        </section>

        {/* Photos */}
        <section className={card}>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase">Photos</h2>
            <span className="text-[11px] text-ash">{images.length}/8 · first photo is the cover · stored in Stripe</span>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((src, i) => (
              <li key={src} className="group relative aspect-[4/5] overflow-hidden bg-stone ring-1 ring-black/5">
                <Image src={src} alt="" fill sizes="200px" className="object-cover" unoptimized={!src.startsWith("/")} />
                {i === 0 && <span className="absolute top-2 left-2 bg-ink px-2 py-0.5 text-[9px] tracking-[0.12em] text-white uppercase">Cover</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <span className="flex gap-1">
                    <button type="button" onClick={() => move(i, -1)} aria-label="Move earlier" className="grid size-8 place-items-center rounded-full bg-white/90 hover:bg-white">
                      <ArrowUp className="size-3.5 -rotate-90" />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} aria-label="Move later" className="grid size-8 place-items-center rounded-full bg-white/90 hover:bg-white">
                      <ArrowDown className="size-3.5 -rotate-90" />
                    </button>
                  </span>
                  <button type="button" onClick={() => setImages((p) => p.filter((x) => x !== src))} aria-label="Remove photo" className="grid size-8 place-items-center rounded-full bg-white/90 text-rose-700 hover:bg-white">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
            {Array.from({ length: uploading }, (_, i) => (
              <li key={`up-${i}`} className="grid aspect-[4/5] place-items-center bg-stone ring-1 ring-black/5">
                <Loader2 className="size-5 animate-spin text-ash" />
              </li>
            ))}
            {images.length + uploading < 8 && (
              <li>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
                  }}
                  className={cx("flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 border-2 border-dashed text-center text-[12px] text-ash transition-colors hover:border-ink hover:text-ink", err("images") ? "border-rose-400" : "border-black/15")}
                >
                  <ImagePlus className="size-6" strokeWidth={1.3} />
                  Add photos
                  <span className="text-[10px]">or drop them here</span>
                </button>
              </li>
            )}
          </ul>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/avif" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ash" strokeWidth={1.5} />
              <input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} placeholder="…or paste a photo link (https://)" className="input py-2.5 pl-9" />
            </div>
            <button
              type="button"
              disabled={!/^https:\/\/\S+$/.test(urlDraft) || images.length >= 8}
              onClick={() => {
                setImages((p) => [...p, urlDraft.trim()]);
                setUrlDraft("");
              }}
              className="shrink-0 border border-black/15 px-4 text-[11px] tracking-[0.1em] uppercase disabled:opacity-40"
            >
              Add
            </button>
          </div>
          {uploadError && <p className="mt-2 text-[12px] text-rose-700">{uploadError}</p>}
        </section>

        {/* Pricing */}
        <section className={card}>
          <h2 className={cardTitle}>Pricing</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={label}>Price (€)</span>
              <input name="price" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" required placeholder="119" className={cx("input", err("price") && "border-rose-400")} />
            </label>
            <label className="block">
              <span className={label}>Original price (€)</span>
              <input name="compareAt" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} inputMode="decimal" placeholder="Only for sales" className={cx("input", err("compareAt") && "border-rose-400")} />
            </label>
          </div>
          <p className="mt-2 text-[12px] text-ash">
            {sale ? (
              <>
                Shows as a sale: <s>€{compareAt}</s> → <strong className="text-ink">€{price}</strong> ({Math.round((1 - Number(price) / Number(compareAt)) * 100)}% off)
              </>
            ) : (
              "Changing the price creates a new price in Stripe and retires the old one, so past orders keep their price."
            )}
          </p>
        </section>

        {/* Options */}
        <section className={card}>
          <h2 className={cardTitle}>Sizes & colours</h2>
          <span className={label}>Sizes</span>
          <div className="flex flex-wrap gap-2">
            {[...SIZE_PRESETS, ...sizes.filter((s) => !SIZE_PRESETS.includes(s))].map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={sizes.includes(s)}
                onClick={() => toggleSize(s)}
                className={cx("min-w-12 border px-3 py-2.5 text-[12px] transition-colors", sizes.includes(s) ? "border-ink bg-ink text-white" : "border-black/15 hover:border-ink")}
              >
                {s}
              </button>
            ))}
            <span className="flex">
              <input
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = customSize.trim().toUpperCase();
                    if (v && !sizes.includes(v)) setSizes((p) => [...p, v]);
                    setCustomSize("");
                  }
                }}
                placeholder="Other size"
                className="input w-28 px-3 py-2 text-[13px]"
              />
            </span>
          </div>
          <p className="mt-2 text-[12px] text-ash">{sizes.length ? `Sold in ${sizes.join(", ")}.` : "No sizes picked: sold as one size."}</p>

          <div className="mt-6 flex items-baseline justify-between">
            <span className={label}>Colour options on this product</span>
            <button type="button" onClick={() => setColors((c) => [...c, { name: "", hex: "#111111" }])} className="flex items-center gap-1 text-[11px] underline">
              <Plus className="size-3.5" /> Add colour
            </button>
          </div>
          {colors.length === 0 ? (
            <p className="text-[12px] text-ash">None — the shopper only picks a size. Use colourway grouping (right) for separate products per colour.</p>
          ) : (
            <ul className="space-y-2">
              {colors.map((c, i) => (
                <li key={i} className="flex items-center gap-2">
                  <input type="color" value={c.hex} onChange={(e) => setColors((p) => p.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))} className="size-11 shrink-0 cursor-pointer border border-black/15 bg-white p-1" aria-label="Swatch colour" />
                  <input value={c.name} onChange={(e) => setColors((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="e.g. Black" className="input py-2.5" />
                  <button type="button" onClick={() => setColors((p) => p.filter((_, j) => j !== i))} aria-label="Remove colour" className="grid size-11 shrink-0 place-items-center text-ash hover:text-rose-700">
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Details */}
        <section className={card}>
          <h2 className={cardTitle}>Details</h2>
          <label className="block">
            <span className={label}>Bullet points (one per line)</span>
            <textarea name="details" defaultValue={product.details} rows={5} className="input" placeholder={"Lightweight shell\nElasticated cuffs and hem\nDesigned in Amsterdam"} />
          </label>
          <p className="mt-2 text-[12px] text-ash">Empty = the store uses the default bullets for the category.</p>
        </section>
      </div>

      {/* Sidebar */}
      <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-3 lg:sticky lg:top-6 lg:self-start">
        <section className={card}>
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span>
              <span className="block text-[13px] font-medium">Live on the store</span>
              <span className="block text-[12px] text-ash">Off = archived in Stripe, hidden from shoppers</span>
            </span>
            <input type="checkbox" name="active" defaultChecked={product.active} className="peer sr-only" />
            <span className="relative h-6 w-11 shrink-0 rounded-full bg-black/15 transition-colors peer-checked:bg-ink after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
          </label>
          <button className="btn-solid mt-5 w-full gap-2" disabled={pending || uploading > 0}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {pending ? "Saving to Stripe…" : isNew ? "Create product" : "Save changes"}
          </button>
          {state?.error && <p className="mt-3 text-[12px] text-rose-700" role="alert">{state.error}</p>}
          {state?.ok && <p className="mt-3 text-[12px] text-emerald-700">{state.ok}</p>}
          {dashboardUrl && (
            <a href={dashboardUrl} target="_blank" rel="noreferrer" className="mt-3 block text-center text-[11px] text-ash underline hover:text-ink">
              Open in Stripe ↗
            </a>
          )}
        </section>

        <section className={card}>
          <h2 className={cardTitle}>Organisation</h2>
          <label className="block">
            <span className={label}>Category</span>
            <input name="category" list="cat-list" defaultValue={product.category} required className={cx("input py-2.5", err("category") && "border-rose-400")} />
            <datalist id="cat-list">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="mt-3 block">
            <span className={label}>Collection</span>
            <input name="collection" list="col-list" defaultValue={product.collection} placeholder="Optional" className="input py-2.5" />
            <datalist id="col-list">
              {collections.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <div className="mt-4 space-y-2.5">
            <label className="flex items-center gap-2.5 text-[13px]">
              <input type="checkbox" name="featured" defaultChecked={product.featured} className="size-[18px] accent-ink" /> Featured on the homepage
            </label>
            <label className="flex items-center gap-2.5 text-[13px]">
              <input type="checkbox" name="isNew" defaultChecked={product.isNew} className="size-[18px] accent-ink" /> &ldquo;New&rdquo; badge
            </label>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className={label}>Order</span>
              <input name="sort" defaultValue={product.sort} inputMode="numeric" placeholder="Auto" className={cx("input py-2.5", err("sort") && "border-rose-400")} />
            </label>
            <label className="block">
              <span className={label}>URL</span>
              <input name="slug" defaultValue={product.slug} placeholder={name ? "auto" : ""} className="input py-2.5" />
            </label>
          </div>
          <label className="mt-3 block">
            <span className={label}>Drop date (Amsterdam time)</span>
            <input name="releaseAt" type="datetime-local" defaultValue={product.releaseAt} className={cx("input py-2.5", err("releaseAt") && "border-rose-400")} />
            <span className="mt-1 block text-[11px] text-ash">In the future = countdown, can&apos;t be bought until then.</span>
          </label>
        </section>

        <section className={card}>
          <h2 className={cardTitle}>Colourway grouping</h2>
          <p className="mb-3 text-[12px] text-ash">Separate products that are the same item in different colours share a group, so the store shows swatches between them.</p>
          <label className="block">
            <span className={label}>Group</span>
            <input name="group" defaultValue={product.group} placeholder="e.g. windbreaker-set" className="input py-2.5" />
          </label>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <label className="block">
              <span className={label}>This colour</span>
              <input name="color" defaultValue={product.color} placeholder="Black" className="input py-2.5" />
            </label>
            <label className="block">
              <span className={label}>Swatch</span>
              <input name="colorHex" type="color" defaultValue={product.colorHex || "#111111"} className="h-[46px] w-14 cursor-pointer border border-black/15 bg-white p-1" />
            </label>
          </div>
        </section>

        {!isNew && (
          <p className="px-1 text-[11px] text-ash">
            Tip: stock per size is set on{" "}
            <Link href="/admin/inventory" className="underline">
              Stock
            </Link>
            .
          </p>
        )}
      </div>
    </form>
  );
}

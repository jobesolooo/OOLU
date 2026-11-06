import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x py-28 text-center">
      <p className="text-[10px] tracking-[0.3em] text-ash uppercase">404</p>
      <h1 className="mt-3 font-display text-5xl font-[900] uppercase">Lost the plot.</h1>
      <p className="mt-4 text-sm text-ash">That page doesn&apos;t exist (anymore).</p>
      <Link href="/shop" className="btn-solid mt-8">Back to the shop</Link>
    </div>
  );
}

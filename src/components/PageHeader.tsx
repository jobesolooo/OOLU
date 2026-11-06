export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="border-b border-black/5 bg-bone">
      <div className="container-x py-[clamp(48px,5vw,96px)]">
        {eyebrow && <p className="eyebrow text-ash">{eyebrow}</p>}
        <h1 className="mt-3 font-display text-[clamp(40px,4.4vw,76px)] leading-[1] tracking-[-0.025em]">{title}</h1>
        {children}
      </div>
    </section>
  );
}

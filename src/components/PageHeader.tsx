export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="grain relative bg-night text-white">
      <div className="container-x py-12 md:py-16">
        {eyebrow && <p className="text-[10px] font-medium tracking-[0.3em] uppercase md:text-[11px]">{eyebrow}</p>}
        <h1 className="mt-3 font-display text-[40px] leading-none font-[900] uppercase md:text-[56px]">{title}</h1>
        {children}
      </div>
    </section>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="grain relative bg-night text-white">
      <div className="container-x py-[clamp(56px,6vw,112px)]">
        {eyebrow && <p className="eyebrow text-white/75">{eyebrow}</p>}
        <h1 className="h-display mt-4">{title}</h1>
        {children}
      </div>
    </section>
  );
}

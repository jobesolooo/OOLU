import Image from "next/image";

/** Split layout used by sign in / sign up / reset pages. */
export function AuthShell({ eyebrow, title, children, image = "/images/drops-photo.jpg" }: { eyebrow?: string; title: string; children: React.ReactNode; image?: string }) {
  return (
    <div className="grid min-h-[calc(100dvh-140px)] lg:grid-cols-2">
      <div className="relative hidden bg-ink lg:block">
        <Image src={image} alt="" fill priority sizes="50vw" className="object-cover object-[30%_center] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <p className="absolute bottom-10 left-10 font-script text-6xl text-white">Wstablished</p>
      </div>
      <div className="flex items-center justify-center px-4 py-14 sm:px-10">
        <div className="w-full max-w-[440px]">
          {eyebrow && <p className="eyebrow text-ash">{eyebrow}</p>}
          <h1 className="mt-3 mb-8 font-display text-[clamp(36px,3.4vw,52px)] leading-none font-[900] uppercase">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}

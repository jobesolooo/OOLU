/** Original "winged W" staff mark: the Wstablished W with cave-bat wings. */
export function WingedW({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 32" className={className} fill="currentColor" aria-hidden>
      {/* left wing */}
      <path d="M22 9 C16 6 9 6 1 10 C5 11 7 13 8 16 C10 14 12 14 14 15 C15 13 17 12 19 13 C19.5 11.5 20.5 10 22 9 Z" />
      {/* right wing */}
      <path d="M42 9 C48 6 55 6 63 10 C59 11 57 13 56 16 C54 14 52 14 50 15 C49 13 47 12 45 13 C44.5 11.5 43.5 10 42 9 Z" />
      {/* serif W */}
      <path d="M19 6 H27 V7.4 L25.6 7.6 L28.7 18.6 L31.6 9.6 L30.8 7.6 L29.4 7.4 V6 H37 V7.4 L35.6 7.6 L38.7 18.6 L41.9 7.6 L40 7.4 V6 H45 V7.4 L43.7 7.7 L38.6 26 H36.9 L32.6 13.6 L28.6 26 H26.9 L21 7.7 L19 7.4 Z" />
    </svg>
  );
}

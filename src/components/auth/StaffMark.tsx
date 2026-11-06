/** Staff mark: the OOLU orbit ring with cave-bat wings (original artwork). */
export function StaffMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 32" className={className} aria-hidden>
      <g fill="currentColor">
        {/* left wing */}
        <path d="M21 10 C15 7 8.5 7 1 11 C5 12 7 14 8 17 C10 15 12 15 14 16 C15 14 17 13 19 14 C19.3 12.6 20 11.2 21 10 Z" />
        {/* right wing */}
        <path d="M43 10 C49 7 55.5 7 63 11 C59 12 57 14 56 17 C54 15 52 15 50 16 C49 14 47 13 45 14 C44.7 12.6 44 11.2 43 10 Z" />
        {/* the OLU letters, simplified */}
        <path d="M26 9h5v5h-5zM27.4 10.4v2.2h2.2v-2.2zM32.5 9h1.4v3.6H37V14h-4.5zM26 15.5h1.4v4.1h2.2v-4.1H31V21h-5z" />
      </g>
      {/* orbit ring */}
      <ellipse cx="32" cy="15.5" rx="12.5" ry="4.2" transform="rotate(-38 32 15.5)" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

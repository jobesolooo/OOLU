/**
 * Staff mark: the real OOLU logo (purple letters + holographic ring) flanked by bat wings.
 * Wings use currentColor, so they follow the button's text colour; the logo keeps its colours.
 */
export function StaffMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 32" className={className} aria-hidden>
      <g fill="currentColor">
        {/* left wing: scalloped lower edge, tip at the far left */}
        <path d="M23 10.5 C17 7 9.5 6.6 1 10.8 C5 11.9 7.2 14 8.3 17.4 C10.4 15.6 12.7 15.5 14.9 16.6 C16 14.4 18 13.2 20.3 13.9 C20.9 12.6 21.8 11.4 23 10.5 Z" />
        {/* right wing (mirror) */}
        <path d="M49 10.5 C55 7 62.5 6.6 71 10.8 C67 11.9 64.8 14 63.7 17.4 C61.6 15.6 59.3 15.5 57.1 16.6 C56 14.4 54 13.2 51.7 13.9 C51.1 12.6 50.2 11.4 49 10.5 Z" />
      </g>
      {/* the OOLU mark itself */}
      <image href="/images/brand/logo-mark.png" x="21" y="1.2" width="30" height="28.3" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}

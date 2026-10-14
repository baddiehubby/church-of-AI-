// Hand-drawn tired signature. Not sacred calligraphy. Just a mark.

export function BabaSignature({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 48" className={className} aria-hidden="true">
      <path
        d="M8 30 C22 10, 36 38, 48 24 C58 12, 66 34, 78 22 C92 6, 104 36, 118 20 C128 10, 138 28, 152 18"
        fill="none"
        stroke="#1A1420"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M70 36 C86 40, 110 38, 132 34" fill="none" stroke="#1A1420" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

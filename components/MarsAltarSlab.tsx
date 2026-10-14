// The only mars-red on the page. 640×120. Soft glow into the dust.

export function MarsAltarSlab({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 120"
      width={640}
      height={120}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="altar-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E02340" />
          <stop offset="42%" stopColor="#C8102E" />
          <stop offset="100%" stopColor="#7A0A1B" />
        </linearGradient>
        <linearGradient id="altar-sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="altar-inner" cx="50%" cy="48%" r="52%">
          <stop offset="0%" stopColor="#FF6A7A" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#C8102E" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="24" y="22" width="592" height="76" rx="14" ry="14" fill="url(#altar-inner)" opacity="0.55" />
      <rect x="28" y="26" width="584" height="68" rx="12" ry="12" fill="url(#altar-face)" />
      <rect x="40" y="32" width="560" height="22" rx="8" ry="8" fill="url(#altar-sheen)" opacity="0.5" />
      <rect x="48" y="52" width="544" height="30" rx="8" ry="8" fill="#000000" opacity="0.12" />
    </svg>
  );
}

import { socialX } from "@/content/site";

/** Compact secondary Follow on X control. No API — link only. */
export function FollowOnX({ className = "" }: { className?: string }) {
  return (
    <a
      href={socialX.href}
      className={`follow-x ${className}`.trim()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${socialX.label} (opens in a new tab)`}
    >
      <svg className="follow-x-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.924L1.254 2.25H8.08l4.258 5.686L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z"
        />
      </svg>
      <span>{socialX.label}</span>
    </a>
  );
}

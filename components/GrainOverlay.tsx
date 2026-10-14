// Assumptions: purely decorative film grain over the whole page; hidden from assistive tech and pointer events.

export function GrainOverlay() {
  return <div className="grain pointer-events-none fixed inset-0 z-50 opacity-[0.07]" aria-hidden="true" />;
}

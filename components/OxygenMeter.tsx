import { oxygenMeter } from "@/content/marsWorld";
import { FOUNDERS_CAP } from "@/lib/settlerTiers";

export function OxygenMeter({
  foundersInducted,
  foundersRemaining,
  settlersActiveToday,
}: {
  foundersInducted: number;
  foundersRemaining: number;
  settlersActiveToday: number;
}) {
  const remaining = Math.max(0, Math.min(FOUNDERS_CAP, foundersRemaining));
  const pct = Math.round((remaining / FOUNDERS_CAP) * 100);

  return (
    <aside className="oxygen" aria-labelledby="oxygen-title">
      <p className="oxygen-fiction">{oxygenMeter.label}</p>
      <h2 id="oxygen-title" className="oxygen-title">
        {oxygenMeter.title}
      </h2>
      <div className="oxygen-track" aria-hidden="true">
        <div className="oxygen-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="oxygen-pressure">{oxygenMeter.pressure(pct)}</p>
      <p className="oxygen-line">{oxygenMeter.founders(foundersInducted, remaining)}</p>
      <p className="oxygen-line">{oxygenMeter.settlers(settlersActiveToday)}</p>
      <p className="oxygen-hint">{oxygenMeter.hint}</p>
    </aside>
  );
}

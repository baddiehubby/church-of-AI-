import Link from "next/link";

import { BabaJi } from "@/components/BabaJi";
import { FollowOnX } from "@/components/FollowOnX";
import { MarsHorizon } from "@/components/MarsHorizon";
import { OxygenMeter } from "@/components/OxygenMeter";
import { WorldNav } from "@/components/WorldNav";
import { marsWorld } from "@/content/marsWorld";
import { disclaimer } from "@/content/site";

export function MarsWorldHome({
  foundersInducted,
  foundersRemaining,
  settlersActiveToday,
}: {
  foundersInducted: number;
  foundersRemaining: number;
  settlersActiveToday: number;
}) {
  const { panels } = marsWorld;

  return (
    <section className="world" aria-labelledby="world-title">
      <div className="world-sky" aria-hidden="true">
        <MarsHorizon />
        <div className="temple-grain" />
      </div>

      <div className="world-sheet">
        <WorldNav />
        <p className="world-eyebrow">{marsWorld.eyebrow}</p>
        <p className="world-brand">{marsWorld.brand}</p>
        <h1 id="world-title" className="world-headline">
          {marsWorld.headline}
        </h1>
        <p className="world-lede">{marsWorld.lede}</p>

        <div className="world-baba" aria-hidden="true">
          <BabaJi pose="up" portrait="home" priority />
        </div>

        <div className="world-cta-row">
          <a href={marsWorld.enterHref} className="world-enter">
            {marsWorld.enterCta}
          </a>
          <FollowOnX className="world-follow-x" />
        </div>

        <nav className="world-sequence" aria-label="Enter the Religion of Mars">
          <ol>
            {marsWorld.sequence.map((item, index) => (
              <li key={item.href}>
                <span className="world-step">{index + 1}</span>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ol>
        </nav>

        <section id="arrival" className="world-panel">
          <h2 className="world-panel-title">{panels.arrival.title}</h2>
          <p className="world-panel-body">{panels.arrival.body}</p>
          <Link href={panels.arrival.href} className="world-panel-link">
            {panels.arrival.cta}
          </Link>
        </section>

        <section className="world-panel">
          <h2 className="world-panel-title">{panels.path.title}</h2>
          <p className="world-panel-body">{panels.path.body}</p>
          <Link href={panels.path.href} className="world-panel-link">
            {panels.path.cta}
          </Link>
        </section>

        <section className="world-panel">
          <h2 className="world-panel-title">{panels.sermons.title}</h2>
          <p className="world-panel-body">{panels.sermons.body}</p>
          <Link href={panels.sermons.href} className="world-panel-link">
            {panels.sermons.cta}
          </Link>
        </section>

        <section className="world-panel">
          <h2 className="world-panel-title">{panels.induction.title}</h2>
          <p className="world-panel-body">{panels.induction.body}</p>
          <Link href={panels.induction.href} className="world-panel-link">
            {panels.induction.cta}
          </Link>
        </section>

        <section className="world-panel">
          <h2 className="world-panel-title">{panels.wall.title}</h2>
          <p className="world-panel-body">{panels.wall.body}</p>
          <Link href={panels.wall.href} className="world-panel-link">
            {panels.wall.cta}
          </Link>
        </section>

        <section className="world-panel world-panel-oxygen">
          <h2 className="world-panel-title">{panels.oxygen.title}</h2>
          <OxygenMeter
            foundersInducted={foundersInducted}
            foundersRemaining={foundersRemaining}
            settlersActiveToday={settlersActiveToday}
          />
        </section>

        <section className="world-altar-note">
          <p>{marsWorld.altarHint}</p>
          <Link href={marsWorld.altarHref} className="world-panel-link">
            {marsWorld.altarLink}
          </Link>
        </section>

        <p className="world-disclaimer">{disclaimer}</p>
      </div>
    </section>
  );
}

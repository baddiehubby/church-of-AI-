import Link from "next/link";

import { BabaJi } from "@/components/BabaJi";
import { MarsHorizon } from "@/components/MarsHorizon";
import { WorldNav } from "@/components/WorldNav";
import { foundingStory } from "@/content/marsWorld";
import { disclaimer } from "@/content/site";

export function FoundingStoryPage() {
  return (
    <section className="story temple" aria-labelledby="story-title">
      <MarsHorizon />
      <div className="temple-sky" aria-hidden="true" />
      <div className="temple-grain" aria-hidden="true" />

      <div className="story-sheet">
        <WorldNav />
        <h1 id="story-title" className="story-title">
          {foundingStory.title}
        </h1>

        <div className="story-baba" aria-hidden="true">
          <BabaJi pose="up" />
        </div>

        {foundingStory.sections.map((section) => (
          <article key={section.id} id={section.id} className="story-block">
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </article>
        ))}

        <nav className="story-nav" aria-label="Continue">
          <Link href="/sermons" className="induction-begin">
            {foundingStory.nextSermons}
          </Link>
          <Link href="/induction" className="archive-back">
            {foundingStory.nextPath}
          </Link>
          <Link href="/" className="archive-back">
            {foundingStory.backWorld}
          </Link>
        </nav>

        <p className="world-disclaimer">{disclaimer}</p>
      </div>
    </section>
  );
}

import Link from "next/link";

import { MarsHorizon } from "@/components/MarsHorizon";
import { WorldNav } from "@/components/WorldNav";
import { sermonsPage } from "@/content/marsWorld";
import type { DailySermon } from "@/lib/dailySermons";
import { disclaimer } from "@/content/site";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function preview(body: string, max = 120): string {
  const clean = body.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

export function DailySermonsPage({
  latest,
  archive,
  page,
  hasMore,
  hasPrev,
}: {
  latest: DailySermon | null;
  archive: DailySermon[];
  page: number;
  hasMore: boolean;
  hasPrev: boolean;
}) {
  const archiveOnly = latest ? archive.filter((row) => row.id !== latest.id) : archive;

  return (
    <section className="sermons temple" aria-labelledby="sermons-title">
      <MarsHorizon />
      <div className="temple-sky" aria-hidden="true" />
      <div className="temple-grain" aria-hidden="true" />

      <div className="sermons-sheet">
        <WorldNav />
        <h1 id="sermons-title" className="sermons-title">
          {sermonsPage.title}
        </h1>
        <p className="sermons-lede">{sermonsPage.lede}</p>
        <p className="sermons-fiction">{sermonsPage.wireNote}</p>

        {latest ? (
          <article className="sermon-latest">
            <p className="sermon-kicker">{sermonsPage.latestLabel}</p>
            <p className="sermon-meta">
              <span className="sermon-sol">SOL {latest.sol}</span>
              <span className="sermon-date"> · {formatDate(latest.published_at)}</span>
            </p>
            <div className="sermon-body">
              {latest.body.split("\n").map((line, index) =>
                line.trim() ? <p key={`${index}-${line.slice(0, 16)}`}>{line}</p> : <br key={`br-${index}`} />,
              )}
            </div>
            <p className="sermon-sign">— baba ji</p>
            <div className="sermon-actions">
              {latest.tweet_url ? (
                <a href={latest.tweet_url} className="sermon-action" rel="noopener noreferrer" target="_blank">
                  {sermonsPage.readOnX}
                </a>
              ) : null}
              <span className="sermon-stamp">{formatDate(latest.published_at)}</span>
            </div>
          </article>
        ) : (
          <div className="sermon-empty" role="status">
            <p className="sermon-empty-title">{sermonsPage.emptyTitle}</p>
            <p>{sermonsPage.emptyBody}</p>
          </div>
        )}

        <section className="sermon-archive" aria-labelledby="sermon-archive-title">
          <h2 id="sermon-archive-title" className="sermon-archive-title">
            {sermonsPage.archiveLabel}
          </h2>
          {archiveOnly.length === 0 ? (
            <p className="sermon-archive-empty">no earlier sermons filed.</p>
          ) : (
            <ul className="sermon-archive-list">
              {archiveOnly.map((row) => (
                <li key={row.id}>
                  <p className="sermon-meta">
                    <span className="sermon-sol">SOL {row.sol}</span>
                    <span className="sermon-date"> · {formatDate(row.published_at)}</span>
                  </p>
                  <p className="sermon-preview">{preview(row.body)}</p>
                  {row.tweet_url ? (
                    <a href={row.tweet_url} className="sermon-action" rel="noopener noreferrer" target="_blank">
                      {sermonsPage.readMore}
                    </a>
                  ) : (
                    <span className="sermon-action is-muted">{sermonsPage.readMore}</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <nav className="sermon-pager" aria-label="Sermon pages">
            {hasPrev ? (
              <Link href={`/sermons?page=${page - 1}`} className="archive-back">
                ← prev
              </Link>
            ) : (
              <span className="archive-back is-disabled">← prev</span>
            )}
            <span className="sermon-page-num">page {page}</span>
            {hasMore ? (
              <Link href={`/sermons?page=${page + 1}`} className="archive-back">
                next →
              </Link>
            ) : (
              <span className="archive-back is-disabled">next →</span>
            )}
          </nav>
        </section>

        <section className="sermon-join">
          <p className="sermon-join-title">{sermonsPage.joinTitle}</p>
          <div className="sermon-join-links">
            <Link href="/story" className="induction-begin">
              {sermonsPage.joinStory}
            </Link>
            <Link href="/induction" className="induction-begin">
              {sermonsPage.joinInduction}
            </Link>
          </div>
          <p className="sermon-join-note">{sermonsPage.joinNote}</p>
        </section>

        <p className="world-disclaimer">{disclaimer}</p>
      </div>
    </section>
  );
}

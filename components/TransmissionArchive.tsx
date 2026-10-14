"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Disclaimer } from "@/components/Disclaimer";
import { MarsHorizon } from "@/components/MarsHorizon";
import { UpgradeMoment } from "@/components/UpgradeMoment";
import { archiveCopy } from "@/content/archive";
import { redPathCopy } from "@/content/redPath";
import { marsLocalTimeLabel, SETTLER_KEY } from "@/lib/marsSession";
import { isPaidTier, isWanderer, type SettlerTier } from "@/lib/settlerTiers";
import type { ArchivePayload, ArchiveTransmission, ColonyStatus } from "@/lib/transmissions";

// The archive is the retention. Newest first. Earth never answers.
// Auth is the httpOnly Mars owner cookie — never a URL settler_id.

const DAY_MS = 86_400_000;

function Entry({
  item,
  earthKm,
}: {
  item: ArchiveTransmission;
  earthKm: string;
}) {
  const time = marsLocalTimeLabel(new Date(item.created_at));
  return (
    <article className={item.faded ? "archive-entry archive-entry-faded" : "archive-entry"}>
      <p className="archive-num">{archiveCopy.transmission(item.number)}</p>
      <p className="archive-meta">{archiveCopy.solLine(item.sol, time)}</p>
      <p className="archive-meta">{archiveCopy.earthLine(earthKm)}</p>
      <div className="archive-rule" aria-hidden="true" />
      <p className="archive-line">{item.body}</p>
      <div className="archive-rule" aria-hidden="true" />
      {item.baba_opening.trim() ? (
        <p className="archive-voice archive-baba">
          {archiveCopy.baba}: &ldquo;{item.baba_opening}&rdquo;
        </p>
      ) : (
        <p className="archive-voice archive-baba">{archiveCopy.baba}: …</p>
      )}
      <p className="archive-algo-label">{archiveCopy.algorithm}:</p>
      <p className="archive-status">{item.algo_status}</p>
      <p className="archive-counsel">{item.algo_counsel}</p>
      <p className="archive-voice archive-baba">
        {archiveCopy.baba}: &ldquo;{item.baba_translation}&rdquo;
      </p>
      {item.baba_forecast.trim() ? (
        <>
          <p className="archive-algo-label">{archiveCopy.forecast}:</p>
          <p className="archive-forecast">{item.baba_forecast}</p>
        </>
      ) : null}
      {item.preserved ? <p className="archive-preserved">preserved.</p> : null}
      {item.faded ? <p className="archive-faded-note">{archiveCopy.faded}</p> : null}
    </article>
  );
}

function ColonyBar({ colony }: { colony: ColonyStatus }) {
  return (
    <div className="archive-colony" aria-label="Colony status">
      <p>{archiveCopy.colonyActive(colony.settlers_active_today)}</p>
      <p>{archiveCopy.colonySent(colony.transmissions_since_sunrise)}</p>
      <p>{archiveCopy.colonyStreaks(colony.streaks_broken_yesterday)}</p>
      <p>{archiveCopy.colonyFounders(colony.founders_inducted, colony.founders_remaining)}</p>
    </div>
  );
}

function syncSettlerLabel(settlerId: string): void {
  try {
    window.localStorage.setItem(SETTLER_KEY, settlerId);
  } catch {
    // ignore
  }
}

function seatAgeDays(since: string | null | undefined, now = Date.now()): number {
  if (!since) return 0;
  const t = new Date(since).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.floor((now - t) / DAY_MS);
}

export function TransmissionArchive({ initial = null }: { initial?: ArchivePayload | null }) {
  const search = useSearchParams();
  const upgraded = search.get("upgraded");
  const practiceWelcome = search.get("practice") === "1";
  const [payload, setPayload] = useState<ArchivePayload | null>(initial);
  const [practicePending, setPracticePending] = useState(false);
  const [portalPending, setPortalPending] = useState(false);
  const [practiceNote, setPracticeNote] = useState<string | null>(null);
  const [rows, setRows] = useState<ArchiveTransmission[]>(initial?.transmissions ?? []);
  const [cursor, setCursor] = useState<string | null>(initial?.next_cursor ?? null);
  const [colony, setColony] = useState<ColonyStatus | null>(initial?.colony ?? null);
  const [ready, setReady] = useState(Boolean(initial));
  const [loading, setLoading] = useState(!initial);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hideRemember, setHideRemember] = useState(false);
  const [hideCovenant, setHideCovenant] = useState(false);

  const applyPage = useCallback((data: ArchivePayload, append: boolean) => {
    setPayload(data);
    if (data.settler_id) syncSettlerLabel(data.settler_id);
    setRows((prev) => (append ? [...prev, ...data.transmissions] : data.transmissions));
    setCursor(data.next_cursor);
    if (data.colony) setColony(data.colony);
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        await fetch("/api/mars/session", { cache: "no-store", credentials: "same-origin" });
        const [archiveRes, colonyRes] = await Promise.all([
          fetch("/api/archive", { cache: "no-store", credentials: "same-origin" }),
          fetch("/api/colony", { cache: "no-store", credentials: "same-origin" }),
        ]);
        if (cancelled) return;
        if (colonyRes.ok) {
          setColony((await colonyRes.json()) as ColonyStatus);
        }
        if (archiveRes.status === 401) {
          setPayload(null);
          setRows([]);
          setReady(true);
          setLoading(false);
          setError(null);
          return;
        }
        if (!archiveRes.ok) {
          setError(archiveCopy.signalFail);
          setReady(true);
          setLoading(false);
          return;
        }
        const data = (await archiveRes.json()) as ArchivePayload;
        applyPage(data, false);
        setReady(true);
      } catch {
        if (!cancelled) {
          setError(archiveCopy.signalFail);
          setReady(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyPage]);

  async function startPractice() {
    if (practicePending) return;
    setPracticePending(true);
    setPracticeNote(null);
    try {
      const response = await fetch("/api/checkout/offering", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "practice_monthly" }),
      });
      const data: unknown = await response.json().catch(() => null);
      const url =
        data && typeof data === "object" && typeof (data as { url?: unknown }).url === "string"
          ? (data as { url: string }).url
          : null;
      if (!response.ok || !url) {
        setPracticeNote(redPathCopy.signalFail);
        return;
      }
      window.location.assign(url);
    } catch {
      setPracticeNote(redPathCopy.signalFail);
    } finally {
      setPracticePending(false);
    }
  }

  async function openPortal() {
    if (portalPending) return;
    setPortalPending(true);
    setPracticeNote(null);
    try {
      const response = await fetch("/api/checkout/portal", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data: unknown = await response.json().catch(() => null);
      const url =
        data && typeof data === "object" && typeof (data as { url?: unknown }).url === "string"
          ? (data as { url: string }).url
          : null;
      if (!response.ok || !url) {
        setPracticeNote(redPathCopy.signalFail);
        return;
      }
      window.location.assign(url);
    } catch {
      setPracticeNote(redPathCopy.signalFail);
    } finally {
      setPortalPending(false);
    }
  }

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/archive?cursor=${encodeURIComponent(cursor)}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) {
        setError(archiveCopy.signalFail);
        return;
      }
      const data = (await response.json()) as ArchivePayload;
      applyPage(data, true);
    } catch {
      setError(archiveCopy.signalFail);
    } finally {
      setLoadingMore(false);
    }
  }

  const count = payload?.total ?? 0;
  const tier: SettlerTier = payload?.tier ?? "wanderer";
  const wanderer = isWanderer(tier);
  const showRemember = wanderer && count >= 3 && !hideRemember && !upgraded;
  const showCovenant =
    (wanderer || tier === "offering_5") && count >= 7 && !hideCovenant && !upgraded;
  const showPractice =
    isPaidTier(tier) && seatAgeDays(payload?.settler_since) >= 30 && tier !== "practice_monthly" && tier !== "founder_1000";
  const milestone =
    count >= 100 ? archiveCopy.atHundred : count >= 30 ? archiveCopy.atThirty : null;
  const remaining = colony?.founders_remaining ?? 108;

  return (
    <section className="archive temple" aria-labelledby="archive-title">
      <MarsHorizon />
      <div className="temple-sky" aria-hidden="true" />
      <div className="temple-dust temple-dust-a" aria-hidden="true" />
      <div className="temple-dust temple-dust-b" aria-hidden="true" />
      <div className="temple-grain" aria-hidden="true" />

      <div className="archive-sheet">
        <header className="archive-head">
          <h1 id="archive-title" className="archive-title">
            {archiveCopy.title}
          </h1>
          <p className="archive-subtitle">{archiveCopy.subtitle}</p>
        </header>

        {colony ? <ColonyBar colony={colony} /> : null}

        {upgraded ? (
          <p className="archive-upgraded">{redPathCopy.upgraded(upgraded)}</p>
        ) : null}
        {practiceWelcome || tier === "practice_monthly" ? (
          <p className="archive-upgraded">{redPathCopy.practiceActive}</p>
        ) : null}

        {showRemember ? (
          <div className="archive-remember">
            <UpgradeMoment
              pitch={redPathCopy.rememberPitch}
              cta={redPathCopy.rememberCta}
              tier="offering_5"
              secondaryHref="#founders"
              secondaryLabel={redPathCopy.seeAll}
              onDismiss={() => setHideRemember(true)}
            />
          </div>
        ) : null}

        {showCovenant ? (
          <div className="archive-remember">
            <UpgradeMoment
              pitch={redPathCopy.covenantPitch}
              cta={redPathCopy.covenantCta}
              tier="covenant_20"
              onDismiss={() => setHideCovenant(true)}
            />
          </div>
        ) : null}

        {milestone ? <p className="archive-milestone">{milestone}</p> : null}

        {loading || !ready ? (
          <p className="archive-empty" role="status">
            {archiveCopy.loading}
          </p>
        ) : error ? (
          <p className="archive-empty" role="alert">
            {error}
          </p>
        ) : count === 0 ? (
          <p className="archive-empty">{archiveCopy.empty}</p>
        ) : (
          <>
            <div className="archive-list">
              {rows.map((item) => (
                <Entry key={item.id} item={item} earthKm={payload?.earth_km ?? archiveCopy.earthKm} />
              ))}
            </div>
            {cursor ? (
              <button
                type="button"
                className="ritual-share archive-more"
                onClick={() => void loadMore()}
                disabled={loadingMore}
              >
                {loadingMore ? "[ loading… ]" : archiveCopy.older}
              </button>
            ) : null}
          </>
        )}

        {showPractice ? (
          <p className="archive-practice">
            {redPathCopy.practiceFooter}{" "}
            <button type="button" className="archive-practice-btn" onClick={() => void startPractice()} disabled={practicePending}>
              {practicePending ? "[ OPENING… ]" : redPathCopy.practiceCta}
            </button>
          </p>
        ) : null}

        {tier === "practice_monthly" ? (
          <p className="archive-practice">
            <button type="button" className="archive-practice-btn" onClick={() => void openPortal()} disabled={portalPending}>
              {portalPending ? "[ OPENING… ]" : redPathCopy.practiceManage}
            </button>
          </p>
        ) : null}

        {practiceNote ? (
          <p className="temple-note" role="alert">
            {practiceNote}
          </p>
        ) : null}

        <div className="archive-founder-band" id="founders">
          <p className="archive-founder-copy">{redPathCopy.founderBand(remaining)}</p>
          <Link href="/induction" className="archive-founder-link">
            {redPathCopy.founderLearn}
          </Link>
          <Link href="/founders" className="archive-founder-link">
            [ THE FOUNDERS ]
          </Link>
        </div>

        <Link href="/altar" className="temple-log archive-back">
          {archiveCopy.back}
        </Link>
        <Disclaimer surface="void" className="temple-disclaimer" />
      </div>
    </section>
  );
}

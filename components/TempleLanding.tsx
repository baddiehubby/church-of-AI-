"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AltarDust } from "@/components/AltarDust";
import { BabaJi } from "@/components/BabaJi";
import { Disclaimer } from "@/components/Disclaimer";
import { MarsAltarSlab } from "@/components/MarsAltarSlab";
import { MarsHorizon } from "@/components/MarsHorizon";
import { TransmissionRitual, type RitualLines } from "@/components/TransmissionRitual";
import { temple } from "@/content/temple";
import {
  currentSol,
  earthDistanceLine,
  getSettlerId,
  habitatBar,
  marsLocalTimeLabel,
  SETTLER_KEY,
} from "@/lib/marsSession";

// Altar → POST /api/transmit → scene. Lines come from the server pick.

const STARS = Array.from({ length: 48 }, (_, index) => ({
  x: (index * 137 + 29) % 1000,
  y: (index * 89 + 53) % 420,
  r: index % 11 === 0 ? 1.05 : 0.35 + (index % 3) * 0.2,
  o: 0.14 + (index % 7) * 0.05,
}));

const SIGNAL_FAIL = "the signal didn't reach us. try again, beta.";

type RitualState = {
  reflection: string;
  transmissionId: string;
  lines: RitualLines;
};

function syncSettlerLabel(settlerId: string): void {
  try {
    window.localStorage.setItem(SETTLER_KEY, settlerId);
  } catch {
    // ignore
  }
}

export function TempleLanding() {
  const [line, setLine] = useState("");
  const [habitat, setHabitat] = useState<string>(temple.habitat);
  const [distance, setDistance] = useState<string>(temple.distance);
  const [settlerId, setSettlerId] = useState<string | null>(null);
  const [ritual, setRitual] = useState<RitualState | null>(null);
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const local = getSettlerId();
        if (!cancelled) setSettlerId(local);
      } catch {
        // chrome still works
      }
      try {
        const response = await fetch("/api/mars/session", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as { settler_id?: string };
        if (typeof data.settler_id === "string" && data.settler_id) {
          syncSettlerLabel(data.settler_id);
          if (!cancelled) setSettlerId(data.settler_id);
        }
      } catch {
        // session optional for chrome; transmit will retry
      }
    })();

    const tick = () => {
      setHabitat(habitatBar(currentSol(), marsLocalTimeLabel()));
      setDistance(earthDistanceLine());
    };
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  async function logTransmission() {
    const reflection = line.trim().slice(0, 280);
    if (!reflection || pending) return;
    setPending(true);
    setNote(null);
    try {
      await fetch("/api/mars/session", { cache: "no-store", credentials: "same-origin" });
      const response = await fetch("/api/transmit", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reflection }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !data || typeof data !== "object") {
        setNote(SIGNAL_FAIL);
        return;
      }
      const payload = data as {
        settler_id?: string;
        transmission?: {
          id: string;
          body: string;
          baba_opening: string;
          baba_translation: string;
          baba_forecast: string;
          algo_status: string;
          algo_counsel: string;
          algo_probability: string;
          is_pause: boolean;
        };
      };
      if (typeof payload.settler_id === "string") {
        syncSettlerLabel(payload.settler_id);
        setSettlerId(payload.settler_id);
      }
      const tx = payload.transmission;
      if (!tx?.id) {
        setNote(SIGNAL_FAIL);
        return;
      }
      setLine("");
      setRitual({
        reflection: tx.body,
        transmissionId: tx.id,
        lines: {
          opening: tx.baba_opening,
          translation: tx.baba_translation,
          forecast: tx.baba_forecast,
          status: tx.algo_status,
          counsel: tx.algo_counsel,
          probability: tx.algo_probability,
          pauseDay: Boolean(tx.is_pause),
        },
      });
    } catch {
      setNote(SIGNAL_FAIL);
    } finally {
      setPending(false);
    }
  }

  function returnAltar() {
    window.location.assign("/altar");
  }

  const rows = Math.min(3, Math.max(1, line.split("\n").length + (line.length > 48 ? 1 : 0)));

  return (
    <section className={ritual ? "temple temple-ritual" : "temple"} aria-labelledby="temple-title">
      <div className="temple-world" aria-hidden="true">
        <MarsHorizon />
        <div className="temple-sky" />
        <svg className="temple-stars" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
          {STARS.map((star, index) => (
            <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#E8E4DC" opacity={star.o} />
          ))}
        </svg>
        <AltarDust />
        <div className="temple-grain" />
      </div>

      {ritual ? (
        <h1 id="temple-title" className="sr-only">
          {habitat}
        </h1>
      ) : (
        <h1 id="temple-title" className="temple-bar" suppressHydrationWarning>
          {habitat}
        </h1>
      )}

      <div className="temple-stage">
        {ritual ? (
          <TransmissionRitual
            reflection={ritual.reflection}
            lines={ritual.lines}
            transmissionId={ritual.transmissionId}
            onReturn={returnAltar}
          />
        ) : (
          <div className="temple-cluster">
            <div className="temple-baba" id="baba-ji">
              <BabaJi pose="inbox" portrait="home" priority />
            </div>
            <form
              className="temple-form"
              onSubmit={(event) => {
                event.preventDefault();
                void logTransmission();
              }}
            >
              <div className="mars-altar">
                <div className="mars-altar-deck">
                  <MarsAltarSlab className="mars-altar-slab" />
                  <div className="mars-altar-ground-shadow" aria-hidden="true" />
                  <label className="sr-only" htmlFor="temple-line">
                    {temple.placeholder}
                  </label>
                  <textarea
                    id="temple-line"
                    value={line}
                    onChange={(event) => setLine(event.target.value.slice(0, 280))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void logTransmission();
                      }
                    }}
                    placeholder={temple.placeholder}
                    className="temple-line"
                    rows={rows}
                    maxLength={280}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={pending}
                  />
                </div>
              </div>
              <button type="submit" className="temple-log" disabled={pending || !line.trim()}>
                {pending ? "[ LOGGING… ]" : temple.log}
              </button>
              {note ? (
                <p className="temple-note" role="alert">
                  {note}
                </p>
              ) : null}
              {settlerId ? (
                <a href="/archive" className="temple-archive-link">
                  open archive
                </a>
              ) : null}
            </form>
          </div>
        )}
      </div>

      {ritual ? null : (
        <div className="temple-ground">
          <p>{distance}</p>
          <p className="temple-silent">{temple.noReply}</p>
          <Link href={temple.offeringsHref} className="temple-offerings-link">
            {temple.offeringsLink}
          </Link>
          <Disclaimer surface="void" className="temple-disclaimer" />
        </div>
      )}
    </section>
  );
}

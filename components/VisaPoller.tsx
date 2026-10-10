"use client";

// Assumptions: shown only while the server says the reference is pending. It asks the server again with
// router.refresh() every 3s for up to 90s; the page decides what to show, so nothing paid is ever rendered here.
// After that it stops and shows the slow message with a refresh link and support email (also the no-JS view).

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { visaSuccess } from "@/content/visa";

const INTERVAL_MS = 3_000;
const LIMIT_MS = 90_000;

export function VisaPoller({ refreshHref, supportHref }: { refreshHref: string; supportHref: string }) {
  const router = useRouter();
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    setPolling(true);
    const started = Date.now();
    const id = window.setInterval(() => {
      if (Date.now() - started > LIMIT_MS) {
        window.clearInterval(id);
        setPolling(false);
        return;
      }
      router.refresh();
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <div className="mt-6" role="status" aria-live="polite">
      {polling ? (
        <p className="text-bone/90">{visaSuccess.pendingBody}</p>
      ) : (
        <>
          <p className="text-bone/90">{visaSuccess.pendingSlow}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={refreshHref} className="btn-brass press">
              {visaSuccess.refresh}
            </a>
            <a href={supportHref} className="btn-outline press">
              {visaSuccess.support}
            </a>
          </div>
        </>
      )}
    </div>
  );
}

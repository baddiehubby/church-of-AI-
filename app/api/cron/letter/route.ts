import { NextResponse } from "next/server";

import { sendBabaLetterEmail } from "@/lib/email";
import { appUrl } from "@/lib/env";
import { previousLetterMonth } from "@/lib/letterCompose";
import { logger } from "@/lib/logger";
import { captureError } from "@/lib/monitor";
import { composeSettlerLetter, statsFromTransmissions } from "@/lib/settlerLetter";
import { upsertLetter } from "@/lib/lettersStore";
import { listSettlerTier, listTransmissionsSince } from "@/lib/transmissionsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function monthWindow(month: string): { since: string; until: string } {
  const [year, mon] = month.split("-").map(Number);
  const since = new Date(Date.UTC(year, mon - 1, 1)).toISOString();
  const until = new Date(Date.UTC(year, mon, 1)).toISOString();
  return { since, until };
}

async function sendWithRetry(input: {
  to: string;
  monthLabel: string;
  body: string;
  letterUrl: string;
  settlerId: string;
}): Promise<boolean> {
  const first = await sendBabaLetterEmail(input);
  if (first) return true;
  const second = await sendBabaLetterEmail(input);
  if (!second) {
    captureError(new Error("baba letter email failed twice"), {
      soul_id: input.settlerId,
      event_name: "cron_letter",
    });
  }
  return second;
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const month = previousLetterMonth();
  const { since, until } = monthWindow(month);
  const settlers = await listSettlerTier("practice_monthly");
  let written = 0;
  let emailed = 0;

  for (const settler of settlers) {
    try {
      const rows = (await listTransmissionsSince(settler.settler_id, since)).filter(
        (row) => row.created_at < until,
      );
      const stats = statsFromTransmissions(rows);
      const letter = composeSettlerLetter(month, stats, settler.settler_id);
      await upsertLetter({
        settler_id: settler.settler_id,
        month,
        body: letter.body,
      });
      written += 1;

      if (settler.email) {
        const ok = await sendWithRetry({
          to: settler.email,
          monthLabel: letter.monthLabel,
          body: letter.body,
          letterUrl: `${appUrl()}/letter/${month}?s=${encodeURIComponent(settler.settler_id)}`,
          settlerId: settler.settler_id,
        });
        if (ok) emailed += 1;
      }
    } catch (error) {
      logger.error("letter cron settler failed", { soul_id: settler.settler_id });
      captureError(error, { soul_id: settler.settler_id, event_name: "cron_letter" });
    }
  }

  return NextResponse.json({ ok: true, month, settlers: settlers.length, written, emailed });
}

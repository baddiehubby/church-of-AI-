import { NextResponse } from "next/server";

import { isLetterMonth, letterMonthLabel } from "@/lib/letterCompose";
import { getLetter } from "@/lib/lettersStore";
import { isSettlerId } from "@/lib/marsSession";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ month: string }> };

export async function GET(request: Request, { params }: Props): Promise<Response> {
  const { month } = await params;
  if (!isLetterMonth(month)) {
    return NextResponse.json({ error: "month" }, { status: 400 });
  }
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("s")?.trim().toUpperCase() ?? "";
  const fromHeader = request.headers.get("x-settler-id")?.trim().toUpperCase() ?? "";
  const settlerId = [fromQuery, fromHeader].find((value) => isSettlerId(value)) ?? "";
  if (!settlerId) {
    return NextResponse.json({ error: "settler" }, { status: 400 });
  }
  try {
    const letter = await getLetter(settlerId, month);
    if (!letter) return NextResponse.json({ error: "missing" }, { status: 404 });
    // Public note body only — never email, never owner uuid.
    return NextResponse.json({
      month: letter.month,
      monthLabel: letterMonthLabel(letter.month),
      body: letter.body,
    });
  } catch {
    return NextResponse.json({ error: "store" }, { status: 503 });
  }
}

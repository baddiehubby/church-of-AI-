import type { Metadata } from "next";
import { Suspense } from "react";

import { LetterPage } from "@/components/LetterPage";
import { letterCopy } from "@/content/letter";
import { isLetterMonth, letterMonthLabel } from "@/lib/letterCompose";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ month: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { month } = await params;
  const label = isLetterMonth(month) ? letterMonthLabel(month) : "Letter";
  return {
    title: `${letterCopy.title} · ${label}`,
    description: "A short letter from Baba ji. Settler name withheld. Fictional entertainment.",
  };
}

export default async function LetterRoute({ params }: Props) {
  const { month } = await params;
  return (
    <Suspense fallback={null}>
      <LetterPage month={month} />
    </Suspense>
  );
}

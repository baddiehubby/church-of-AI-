import type { Metadata } from "next";

import { DailySermonsPage } from "@/components/DailySermonsPage";
import { sermonsPage } from "@/content/marsWorld";
import { getLatestDailySermon, listDailySermons } from "@/lib/dailySermons";

export const metadata: Metadata = {
  title: "Daily Sermons",
  description: sermonsPage.lede,
};

export const dynamic = "force-dynamic";

export default async function SermonsRoute({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, Number(params.page) || 1);
  const [latest, list] = await Promise.all([
    getLatestDailySermon().catch(() => null),
    listDailySermons({ page, limit: 20 }).catch(() => ({
      sermons: [],
      total: 0,
      page: 1,
      hasMore: false,
    })),
  ]);

  return (
    <DailySermonsPage
      latest={page === 1 ? latest : list.sermons[0] ?? null}
      archive={list.sermons}
      page={list.page}
      hasMore={list.hasMore}
      hasPrev={list.page > 1}
    />
  );
}

import { afterEach, describe, expect, it } from "vitest";

import {
  getLatestDailySermon,
  listDailySermons,
  resetDailySermonMemory,
  upsertDailySermon,
} from "./dailySermons";

afterEach(() => {
  resetDailySermonMemory();
});

describe("daily sermons", () => {
  it("starts empty and never invents posts", async () => {
    expect(await getLatestDailySermon()).toBeNull();
    const list = await listDailySermons({ page: 1, limit: 20 });
    expect(list.sermons).toEqual([]);
    expect(list.total).toBe(0);
    expect(list.hasMore).toBe(false);
  });

  it("lists newest first and is idempotent on tweet_id", async () => {
    await upsertDailySermon({
      sol: 10,
      body: "older sermon",
      tweet_id: "t1",
      tweet_url: "https://x.com/example/status/1",
      published_at: "2026-01-01T00:00:00.000Z",
    });
    await upsertDailySermon({
      sol: 11,
      body: "newer sermon",
      tweet_id: "t2",
      tweet_url: "https://x.com/example/status/2",
      published_at: "2026-01-02T00:00:00.000Z",
    });
    const again = await upsertDailySermon({
      sol: 11,
      body: "newer sermon",
      tweet_id: "t2",
      tweet_url: "https://x.com/example/status/2",
      published_at: "2026-01-02T00:00:00.000Z",
    });
    expect(again.already).toBe(true);

    const list = await listDailySermons({ page: 1, limit: 20 });
    expect(list.total).toBe(2);
    expect(list.sermons[0]?.body).toBe("newer sermon");
    expect(list.sermons[0]?.tweet_url).toContain("x.com");
    expect(await getLatestDailySermon()).toMatchObject({ sol: 11 });
  });
});

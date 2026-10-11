import type { Metadata } from "next";
import Link from "next/link";

import { accountCopy, zones } from "@/content/congregation";
import { currentSoul, getReport, listPoojas, listWishes, saveReport } from "@/lib/congregation";
import { composeReport } from "@/lib/sermonCompose";
import { readSession } from "@/lib/session";
import { lemonApiKey } from "@/lib/env";
import { stripeSecret } from "@/lib/stripeBilling";
import { atLeast } from "@/lib/tiers";
import { monthLabel, monthStart, safeZone, zonedToUtc } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Account" };

type Props = { searchParams: Promise<{ notice?: string }> };

export default async function AccountPage({ searchParams }: Props) {
  const query = await searchParams;
  const session = await readSession();
  const soul = await currentSoul();
  if (!soul) {
    return (
      <article className="mx-auto max-w-xl px-4 py-16">
        <h1 className="display text-4xl text-bone">{accountCopy.title}</h1>
        <p className="serif-warm mt-4 text-2xl">{accountCopy.empty}</p>
        <Link href="/login?next=/account" className="btn-brass press mt-8">
          {accountCopy.signIn}
        </Link>
      </article>
    );
  }
  const zone = safeZone(soul.timezone);
  const now = new Date();
  const devotee = atLeast(soul.tier, "devotee");
  let report: { body: string; algoLine: string; panditReply: string } | null = null;
  if (devotee) {
    const month = monthStart(now, zone);
    const saved = await getReport(soul.userId, month).catch(() => null);
    const label = monthLabel(now, zone);
    if (saved) {
      const fresh = composeReport({ name: soul.name, monthName: label, poojas: [], wishes: [] });
      report = { body: saved.body, algoLine: fresh.algoLine, panditReply: fresh.panditReply };
    } else {
      const since = zonedToUtc(month, 0, 0, zone).toISOString();
      const poojas = await listPoojas(soul.userId, since).catch(() => []);
      const wishes = await listWishes(soul.userId, since).catch(() => []);
      const draft = composeReport({
        name: soul.name,
        monthName: label,
        poojas: poojas.map((row) => ({ mood: row.mood, reflection: row.reflection })),
        wishes: wishes.map((row) => ({ category: row.category, wish: row.wish })),
      });
      await saveReport(soul.userId, month, draft.body).catch(() => null);
      report = draft;
    }
  }
  const zoneOptions = zones.includes(zone as (typeof zones)[number]) ? zones : [zone, ...zones];
  const notice = query.notice === "paid" ? accountCopy.paid : query.notice === "name" ? "THE NAME CANNOT BE FILED." : null;
  return (
    <article className="mx-auto max-w-xl px-4 py-12">
      <h1 className="display text-4xl text-bone">{accountCopy.title}</h1>
      <p className="mt-4 font-mono text-sm tracking-[0.14em] text-brass-light">{soul.userId}</p>
      {notice ? <p className="mt-4 font-mono text-sm text-brass-light">{notice}</p> : null}
      {soul.pastDue ? <p className="mt-4 text-sm text-bone">{accountCopy.pastDue}</p> : null}
      <dl className="mt-8 grid gap-4">
        <div>
          <dt className="font-mono text-xs tracking-[0.14em] text-brass">{accountCopy.seat}</dt>
          <dd className="mt-1 font-mono text-sm text-bone">{soul.tier.toUpperCase()}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs tracking-[0.14em] text-brass">{accountCopy.streak}</dt>
          <dd className="mt-1 font-mono text-sm text-bone">{soul.streakCurrent}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs tracking-[0.14em] text-brass">{accountCopy.longest}</dt>
          <dd className="mt-1 font-mono text-sm text-bone">{soul.streakLongest}</dd>
        </div>
      </dl>
      <form action="/api/account" method="post" className="mt-8 grid gap-4">
        <label className="grid gap-2 text-sm">
          {accountCopy.zone}
          <select name="timezone" defaultValue={zone} className="focus-ring min-h-12 border border-brass/70 bg-night px-3 text-bone">
            {zoneOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <span className="text-mist">{accountCopy.zoneHelp}</span>
        </label>
        <label className="grid gap-2 text-sm">
          {accountCopy.name}
          <input name="name" defaultValue={soul.name ?? ""} maxLength={40} className="focus-ring min-h-12 border border-brass/70 bg-night px-3 text-bone" />
          <span className="text-mist">{accountCopy.nameHelp}</span>
        </label>
        <button type="submit" className="btn-brass press w-full sm:w-auto">
          {accountCopy.save}
        </button>
      </form>
      {soul.tier === "darshan" ? (
        <form action="/api/account" method="post" className="mt-4">
          <input type="hidden" name="urgent" value={soul.urgentArmed ? "0" : "1"} />
          <button type="submit" className="btn-outline press">
            {soul.urgentArmed ? accountCopy.urgentOn : accountCopy.urgent}
          </button>
        </form>
      ) : null}
      {devotee && report ? (
        <section className="mt-10 border border-brass/50 p-5">
          <h2 className="font-mono text-xs tracking-[0.16em] text-brass">{accountCopy.report}</h2>
          <p className="serif-warm mt-4 text-xl text-bone">{report.body}</p>
          <p className="mt-4 font-mono text-sm text-brass-light">{report.algoLine}</p>
          <p className="serif-warm mt-2 text-lg">{report.panditReply}</p>
        </section>
      ) : (
        <p className="mt-8 text-sm text-mist">{accountCopy.reportLocked}</p>
      )}
      <nav aria-label={accountCopy.links} className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link href="/sermon/archive" className="text-brass-light underline">
          Sermons
        </Link>
        <Link href="/darshan" className="text-brass-light underline">
          Darshan
        </Link>
        <Link href="/congregation" className="text-brass-light underline">
          Congregation
        </Link>
        <Link href="/pricing" className="text-brass-light underline">
          Pricing
        </Link>
      </nav>
      {soul.lemonSubscriptionId && lemonApiKey() ? (
        <form action="/api/lemon/portal" method="post" className="mt-6">
          <button type="submit" className="btn-outline press">
            {accountCopy.portal}
          </button>
        </form>
      ) : soul.stripeCustomerId && stripeSecret() ? (
        <form action="/api/stripe/portal" method="post" className="mt-6">
          <button type="submit" className="btn-outline press">
            {accountCopy.portal}
          </button>
        </form>
      ) : null}
      {session ? (
        <form action="/api/auth/signout" method="post" className="mt-4">
          <button type="submit" className="btn-outline press">
            {accountCopy.signOut}
          </button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-mist">{accountCopy.signIn}</p>
      )}
    </article>
  );
}

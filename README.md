# Sacha Pandit

A fictional entertainment wish engine at [sachapandit.com](https://sachapandit.com). You pick a category, write a wish, and receive an AI-generated reading. Three separate paid products: a pay-what-you-want blessing / offering (minimum $10, petition certificate), an optional $10 one-time Visa Wish Certificate, and Sacha Pandit Premium at $10/month. Not a charity. Not tax-deductible. Not immigration advice. Nothing here comes true because you paid.

Brand name comes from `NEXT_PUBLIC_BRAND_NAME` (default **Sacha Pandit**) and `lib/brand.ts`.

## What this is

One wish, one verdict, one payment. The Algorithm writes a bureaucratic reading. Pandit ji answers in one tired line. You may leave an offering for a certificate, buy a visa-themed entertainment certificate, or subscribe to Premium. None of those change any real-world outcome.

Out of scope (files may still exist): subscriptions dashboards, admin, tweet queue, press page, ledger wall, extra paid tiers, Discord, merch.

## Disclaimer

> This is a fictional AI-generated entertainment experience. It has no legal effect and does not influence any government, immigration, university, employer, romantic partner, or other authority.

That sentence is on every page (footer + `Disclaimer.tsx`) and in emails.

## Stack

Next.js 15 (App Router, TypeScript strict), Tailwind v4, Lemon Squeezy (merchant of record), Supabase (Postgres), Resend (email), Upstash Redis (rate limit), Sentry (errors), `next/og` for certificate PNGs. Package manager: `corepack pnpm`.

```bash
corepack pnpm install
cp .env.example .env.local   # fill in values; .env.local is gitignored
corepack pnpm dev            # http://localhost:3000
corepack pnpm test           # vitest
corepack pnpm lint
corepack pnpm exec tsc --noEmit
```

Do not run a production build while `corepack pnpm dev` is already serving `:3000`.

## Flow

1. `/` landing: photorealistic hero with a CSS holographic overlay (scan lines, sparse cyan/gold light; static still if reduced-motion or JS off). No audio. Not lip-sync. Wish desk with categories. Free categories generate a reading immediately and go to `/verdict/<id>`.
2. Visa categories (Canada, USA, UK, Australia, Europe) file a petition and open Lemon checkout for the $10 blessing / offering (`LEMON_SQUEEZY_VARIANT_ID`). An optional Visa Wish Certificate (`LEMON_SQUEEZY_VISA_VARIANT_ID`) stays available when that variant is connected. Custom data for visa is only `{ kind: "visa", reference_id }`.
3. Lemon redirects to `/certificate/<petitionId>` for offerings, or `/visa/<reference_id>` for the visa SKU. The visa page polls until the webhook marks the row paid. Visiting the URL alone shows nothing paid.
4. `POST /api/webhook` verifies the raw-body HMAC, is idempotent on the Lemon order id, unlocks on `order_created` (paid), and revokes a visa wish on `order_refunded`. Not rate-limited.
5. After a free reading, `/verdict/<id>` has a one-time offering (minimum $10, presets $10 / $15 / $25 / $50 / custom) on `LEMON_SQUEEZY_VARIANT_ID`. A holographic reminder is a joke and does not block the reading. Premium is offered separately.
6. Premium is `LEMON_SQUEEZY_PREMIUM_VARIANT_ID` ($10/month). Checkout stays disabled until an unchecked consent box is checked. Sign-in is a magic link (`SESSION_SECRET`). Journal routes 404 without a session.

Missing Lemon/auth credentials: the homepage still works; visa and Premium show in-page configuration errors. Checkout failures stay on the request origin (`safeRedirectOrigin`). Localhost never bounces to sachapandit.com.

If the model is down, `/api/wish` still returns a hardcoded fallback reading (`lib/algorithm.ts` / `lib/fallbackVerdict.ts`). It does not 500 for a model failure. If Supabase is down, `/verdict/<id>` and `/certificate/<id>` show: `the Algorithm is occupied. try again in a moment, beta.` plus a retry link.

## Environment variables

See `.env.example` for the full list with comments.

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_URL` | yes in prod | `https://sachapandit.com`. Use `http://localhost:3000` locally so checkout notices never bounce to production. |
| `NEXT_PUBLIC_BRAND_NAME` | no | Defaults to "Sacha Pandit". Wired through `lib/brand.ts`. |
| `LEMON_SQUEEZY_API_KEY` | yes | Lemon → Settings → API. |
| `LEMON_SQUEEZY_STORE_ID` | yes | Numeric store id. |
| `LEMON_SQUEEZY_VARIANT_ID` | for certificates / blessings | Pay-what-you-want offering, minimum $10. |
| `LEMON_SQUEEZY_VISA_VARIANT_ID` | for visa wishes | $10 Visa Wish Certificate variant. Price comes from the variant, never the client. |
| `LEMON_SQUEEZY_PREMIUM_VARIANT_ID` | for Premium | $10/month subscription variant. Recurring; no customPrice. |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | yes | Signing secret of the webhook endpoint. |
| `SESSION_SECRET` | for Premium login | HMAC for the sign-in cookie. |
| `SUPABASE_URL` | yes in prod | Project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes in prod | Server only. Never expose it to the browser. Locally, an in-memory store is used if these are empty. |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | no | Readings. If both empty, a local fallback pool is used. |
| `OPENAI_BASE_URL` / `OPENAI_MODEL` | no | Optional OpenAI overrides. |
| `RESEND_API_KEY` | no | If empty, petition certificate email is skipped. |
| `RESEND_FROM_EMAIL` | no | `church@sachapandit.com` (domain must be verified). |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | no | Rate limits. Without them an in-memory limiter is used (one logger warning). |
| `SENTRY_DSN` | no | Empty disables Sentry (`sendDefaultPii: false`, `tracesSampleRate: 0.1`). Events keep only `petition_id`, `soul_id`, `reference_id`, `order_id`, `tier`, `event_name`, `amount_cents`. |

## Rate limits

Hashed IP = sha256 of the first `x-forwarded-for` hop, truncated. Keys and logs never store the raw IP.

| Route | Limit | Notes |
| --- | --- | --- |
| `POST /api/wish` | 3 / IP / hour **and** 1 / 30 seconds (both must pass) | Blessing / visa checkout on this route also takes the checkout limit. |
| `POST /api/checkout` | 5 / IP / 10 minutes | Offering / certificate. |
| `POST /api/premium/checkout` | 5 / IP / 10 minutes | Same checkout bucket. |
| `POST /api/webhook` | never | HMAC only. |
| `GET /api/health` | never | Uptime probe. |

429 JSON is Pandit ji voice, from `content/safety.ts`: `slow down, beta. the desk already heard you.`

## Supabase

1. Create a project.
2. In the SQL editor, run the migrations **in this order**: `002_petitions.sql`, `003_webhook_events.sql`, `004_visa_wishes.sql`, `005_premium.sql` (current files below).
3. Copy the project URL and the service role key into `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

Row level security is on; after all four migrations, anon and authenticated have no table access. Only the server (service role) reads or writes. Never expose the service role key to the client.

`webhook_events` is an audit log: one row per webhook request (`issued`, `duplicate`, `revoked`, `ignored_event`, `not_paid`, `bad_signature`, `invalid_payload`, `db_error`). It never stores the raw body, wish, name, or email.

### 002_petitions.sql

```sql
-- Petitions and certificates. Service role writes. No anon insert.
-- locale is not a column: the app does not read or write a locale.
-- certificates.name is nullable. certificates.tier stays nullable with default 'basic' so older rows do not break.

create table if not exists public.petitions (
  id uuid primary key default gen_random_uuid(),
  petition_id text unique not null,
  wish text not null,
  category text not null,
  algo_status text not null,
  algo_sacrifices jsonb not null,
  algo_counsel text not null,
  algo_probability text not null,
  pandit_reply text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  petition_id text not null references public.petitions (petition_id),
  lemon_order_id text unique not null,
  issued_at timestamptz not null default now(),
  name text,
  tier text default 'basic'
);

alter table public.petitions enable row level security;
alter table public.certificates enable row level security;

create or replace view public.petition_ledger
with (security_invoker = false) as
select petition_id, category, algo_status as status, created_at, wish
from public.petitions;

revoke all on table public.petitions from anon, authenticated;
revoke all on table public.certificates from anon, authenticated;
revoke all on table public.petition_ledger from anon, authenticated;
grant select on table public.petition_ledger to anon, authenticated, service_role;
```

### 003_webhook_events.sql

```sql
-- Assumptions: audit log of every webhook request, written by the server with the service role (bypasses RLS).
-- outcome is one of: issued, duplicate, revoked, ignored_event, not_paid, bad_signature, invalid_payload, db_error.
-- kind is visa or certificate. reference is a petition id or a public visa certificate number, never the private
-- visa link token. detail is a short code, never PII. No raw bodies, wish text, names, or emails are stored here.

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  event_name text,
  lemon_order_id text,
  kind text,
  reference text,
  signature_valid boolean not null,
  outcome text not null,
  detail text
);
create index if not exists idx_webhook_events_received_at on public.webhook_events (received_at desc);
create index if not exists idx_webhook_events_order on public.webhook_events (lemon_order_id);
alter table public.webhook_events enable row level security;
revoke all on table public.webhook_events from anon, authenticated;
```

### 004_visa_wishes.sql

```sql
-- Visa wishes ($10). Written only by the server with the service role; RLS on, no anon or authenticated access.
-- reference_id is the private, unguessable link token (/visa/<reference_id>), the only value sent to Lemon
-- Squeezy as custom data. certificate_no is the public number printed on the certificate and used for share links.
-- A row is created as 'pending' before checkout and becomes 'paid' only from a verified order_created webhook;
-- order_refunded sets 'refunded'. The reading is generated once after payment and stored. No card data, ever.

create table if not exists public.visa_wishes (
  id uuid primary key default gen_random_uuid(),
  reference_id text unique not null,
  certificate_no text unique not null,
  category text not null,
  country text not null,
  wish text not null,
  first_name text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded')),
  lemon_order_id text unique,
  paid_at timestamptz,
  refunded_at timestamptz,
  reading jsonb,
  reading_generated_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.visa_wishes enable row level security;
revoke all on table public.visa_wishes from anon, authenticated;

-- The wish-engine ledger wall is out of scope; do not expose petition wishes to anon.
revoke all on table public.petition_ledger from anon, authenticated;
```

### 005_premium.sql

```sql
-- Premium ($10/month). Service role only; RLS on, no anon or authenticated access.
-- profiles = signed-in members. premium_entitlements tracks Lemon subscription_id and status.
-- wish_entries + readings = private journal and follow-up threads. preferences caches daily guidance
-- per UTC date. share_cards are created only when the member asks; include_wish defaults false.
-- English only for now; preferences.locale is reserved. TODO: Hindi later.
-- No passport or visa-application columns.

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.login_tokens (
  token_hash text primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists public.premium_entitlements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  lemon_subscription_id text unique not null,
  status text not null check (status in ('active', 'cancelled', 'expired', 'past_due')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.wish_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  thread_id uuid not null,
  wish text not null,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.wish_entries (id) on delete cascade,
  verdict jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.preferences (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  goals text,
  locale text not null default 'en',
  daily_on_utc_date text,
  daily_text text,
  updated_at timestamptz not null default now()
);

create table if not exists public.share_cards (
  public_id text unique not null,
  entry_id uuid not null references public.wish_entries (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  summary text not null,
  reflection text not null,
  include_wish boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.login_tokens enable row level security;
alter table public.premium_entitlements enable row level security;
alter table public.wish_entries enable row level security;
alter table public.readings enable row level security;
alter table public.preferences enable row level security;
alter table public.share_cards enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.login_tokens from anon, authenticated;
revoke all on table public.premium_entitlements from anon, authenticated;
revoke all on table public.wish_entries from anon, authenticated;
revoke all on table public.readings from anon, authenticated;
revoke all on table public.preferences from anon, authenticated;
revoke all on table public.share_cards from anon, authenticated;
```

## Lemon Squeezy

Create **three** products. Do **not** invent variant ids in this repo. Paste the real ids into env after you create them in the Lemon dashboard.

In every Lemon listing, **do not use** the words "AI" or "approved" (including "visa approved"). Do not imply a wish comes true. Do not describe this as a charity.

Store policy URLs: `https://sachapandit.com/terms`, `/privacy`, `/refunds`.

### 1. Blessing / offering (pay-what-you-want, min $10)

1. Create a **digital** product (not a physical good, not a subscription). Pay-what-you-want, **minimum $10 USD**, maximum you are comfortable with (the app caps $500). One-time.
2. Suggested name: **Petition Offering — Sacha Pandit Entertainment Artifact**
3. Description (paste):

   > A digital novelty offering for a fictional entertainment reading and petition certificate. The buyer receives a novelty artifact from Sacha Pandit. This is not a charity. Payments are not tax-deductible. There are no supernatural guarantees. An offering does not make a wish come true and has no legal effect.

4. Copy the **variant id** into `LEMON_SQUEEZY_VARIANT_ID`. Checkout sends `customPrice` in cents ≥ 1000. Redirect and receipt URLs are set in code to `/certificate/<petitionId>`.

### 2. Visa Wish Certificate ($10 one-time)

1. Create a **digital** product (not a physical good, not a subscription).
2. Suggested name: **Visa Wish Certificate — Sacha Pandit Entertainment Artifact**
3. Price: **$10 USD**, one-time.
4. Description (paste):

   > An entertainment certificate only. The buyer receives a personalized wish reading and a shareable Visa Wish Certificate from Sacha Pandit. This is fictional entertainment. It cannot issue visas or influence immigration. It is not a government decision and not immigration advice.

5. Confirmation / receipt: Lemon will use the redirect and receipt link URLs sent at checkout (`https://sachapandit.com/visa/<reference>`). You do not paste a single static success URL, because each wish has its own unguessable reference.
6. Copy the **variant id** into `LEMON_SQUEEZY_VISA_VARIANT_ID`.
7. The charged price always comes from the variant. The checkout request never sends `customPrice` for visa wishes.

### 3. Sacha Pandit Premium ($10/month)

1. Create a **subscription** product, $10 USD / month.
2. Name: **Sacha Pandit Premium**.
3. Description (paste):

   > A recurring digital companion: private journal, daily guidance, follow-ups, and shareable cards. $10 USD per month. Cancel anytime in the Lemon Squeezy customer portal. Entertainment only. Not immigration advice and not legal advice. Premium does not make a wish come true.

4. Copy the variant id into `LEMON_SQUEEZY_PREMIUM_VARIANT_ID`. Add a checkout custom field `profile_id` if Lemon requires custom data keys to be declared.
5. Redirect/receipt URLs are set in code to `/journal`.

### Webhook events

Endpoint: `https://sachapandit.com/api/webhook`

- Offering / certificate and Visa: `order_created`, `order_refunded`
- Premium: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired` (also accepted: `subscription_paused`, `subscription_unpaused`, `subscription_resumed`, `subscription_payment_success`, `subscription_payment_failed`)

Copy the signing secret into `LEMON_SQUEEZY_WEBHOOK_SECRET`.

## Resend

Verify `sachapandit.com` in Resend. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (e.g. `church@sachapandit.com`). If the key is empty, certificates still store; the email is skipped. The exact site disclaimer is appended to every email.

## Upstash

Create a Redis database. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. If either is missing, the app uses an in-memory limiter and logs one warning. Local still works. `/api/webhook` and `/api/health` are never limited.

## Sentry

Create a Next.js project. Set `SENTRY_DSN`. Empty DSN = no-op. `sendDefaultPii` is false. `tracesSampleRate` is 0.1. `beforeSend` allowlists only: `petition_id`, `soul_id`, `reference_id`, `order_id`, `tier`, `event_name`, `amount_cents`. Names, emails, raw wish, bodies, cookies, and query strings are dropped. Exceptions are captured on wish, checkout, and webhook.

## Vercel

1. Import the GitHub repo.
2. Add every env var above. Set `NEXT_PUBLIC_URL=https://sachapandit.com`.
3. Point the Lemon webhook at `https://sachapandit.com/api/webhook` with the order and subscription events listed above.
4. Check `https://sachapandit.com/api/health`.

## Health check

`GET /api/health` checks Supabase and Lemon Squeezy in parallel (5 second timeout each) and returns:

```json
{ "ok": true, "supabase": "ok", "lemon": "ok" }
```

Each value is `ok`, `down`, or `unconfigured`. Status is 200 when both are `ok`, otherwise 503. Not rate-limited.

## Local webhook

With `corepack pnpm dev` running and `LEMON_SQUEEZY_WEBHOOK_SECRET` plus the Supabase vars set in `.env.local`:

1. Expose the app: `ngrok http 3000` (or similar). Point a Lemon **test** webhook at `https://<ngrok>/api/webhook`.
2. Replay signed fixtures:

```bash
corepack pnpm test:webhook
corepack pnpm test:webhook --kind visa --reference vw_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
corepack pnpm test:webhook --event order_refunded --kind visa --order-id 12345
corepack pnpm test:webhook --kind premium --event subscription_created --profile-id aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

It signs the body with the same HMAC helper the webhook uses. A well-formed unpaid visa reference still shows nothing paid on `/visa/<reference>`. Send the same order id twice: the second response is still 200 (`duplicate`).

## Set these before launch

Do this in each vendor **dashboard**. Do not call their APIs from this repo. Suggested conservative numbers for a small entertainment launch:

| Vendor | Where | Suggested cap / alert |
| --- | --- | --- |
| **Sentry** | Settings → Subscription / spike protection | Stay on the free developer plan if you can. If you pay, hard cap **$10/month**. Alert at **80%** of event quota. Enable spike protection. |
| **Upstash** | Redis database → Usage / budget | Free tier (~10k commands/day) is enough for launch. Budget alert **$5**. Hard limit **$10** if the console offers one. |
| **Resend** | Usage / billing | Free monthly email quota. Alert at **80%**. Do not enable paid scale until the first week needs it. If you must pay, cap **$10/month**. |
| **OpenAI** | Settings → Limits (if you use `OPENAI_API_KEY`) | Monthly budget **$10**. Email alert at **$5**. |
| **Anthropic** | Workspace spend (if you use `ANTHROPIC_API_KEY`) | Monthly spend limit **$10**. Alert at **$5**. |
| **Supabase** | Organization → Billing / spend cap | Stay on Free if traffic allows. Org spend cap **$25**. Alert on disk and egress. Disable unused add-ons. |
| **Vercel** | Team → Billing → Spend Management | Hard cap **$20**. Notify at **$10**. Watch function invocations and image optimization. |

Revisit after the first week of real traffic. Do not raise a cap because a dashboard looks empty on day one.

## QA checklist (before launch)

- [ ] Exact disclaimer on `/`, `/verdict`, `/certificate`, `/terms`, `/privacy`, `/refunds`, visa/success, and emails
- [ ] Real $10 blessing/offering purchase → certificate/slip within 60s
- [ ] Visa Wish $10 one-time → reading only after webhook
- [ ] Premium $10/month; consent required; cancel via Lemon portal
- [ ] Webhook HMAC; duplicate order id returns 200
- [ ] `/api/wish` 429 after 1/30s or 3/hour (Pandit voice JSON)
- [ ] `/api/checkout` 429 after 5/10 min; `/api/webhook` and `/api/health` never limited
- [ ] Lemon timeout stays on origin (no sachapandit.com bounce from localhost)
- [ ] LLM failure still returns a reading (never 500)
- [ ] Supabase down on `/verdict` and `/certificate` shows occupied copy + retry
- [ ] Repo grep for the forbidden charitable-gift word = 0 (exclude `node_modules` and `.next`)
- [ ] Never "visa approved"
- [ ] Lighthouse on home, a verdict, and a legal page
- [ ] Phone (iPhone + Android): wish desk, checkout, certificate
- [ ] Sentry no PII (allowlist only: petition_id, soul_id, reference_id, order_id, tier, event_name, amount_cents)
- [ ] `/api/health`
- [ ] Local webhook: ngrok + `pnpm test:webhook`
- [ ] Footer links Terms, Privacy, Refunds

## Notes

- Never "visa approved". The result heading is **YOUR VISA WISH HAS BEEN RECEIVED BY SACHA PANDIT**.
- Do not share passport numbers or visa application numbers.
- Devanagari names on OG images are shaped with HarfBuzz (`lib/ogShape.ts`) when the name is Devanagari-only plus basic Latin.
- Policies: `/terms`, `/privacy`, `/refunds`.
- Report a petition: small "report this petition" mailto on every `/verdict/[id]` and `/certificate/[id]`.

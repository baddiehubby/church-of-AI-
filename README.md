# Sacha Pandit

A fictional entertainment toy at [sachapandit.com](https://sachapandit.com). You pick a category, write a wish, and receive an AI-generated reading. Three separate paid products: a pay-what-you-want offering (petition certificate), a $10 one-time Visa Wish, and Sacha Pandit Premium at $10/month. Not a charity. Not immigration advice. Nothing here comes true because you paid.

Footer disclaimer (on every page):

> This is a fictional AI-generated entertainment experience. It has no legal effect and does not influence any government, immigration, university, employer, romantic partner, or other authority.

## Stack

Next.js 15 (App Router, TypeScript strict), Tailwind v4, Lemon Squeezy (merchant of record), Supabase (Postgres), Resend (email), Upstash Redis (rate limit), Sentry (errors), `next/og` for certificate PNGs. Package manager: `corepack pnpm`.

```bash
corepack pnpm install
cp .env.example .env.local   # fill in values; .env.local is gitignored
corepack pnpm dev            # http://localhost:3000
corepack pnpm test           # vitest
corepack pnpm build
```

## Flow

1. `/` landing: photorealistic hero with a CSS holographic overlay (scan lines, sparse cyan/gold light; static still if reduced-motion or JS off). No audio. Not lip-sync. Wish desk with categories. Free categories generate a reading immediately and go to `/verdict/<id>`.
2. Visa categories (Canada, USA, UK, Australia, Europe) store a pending row, then open Lemon checkout for the $10 variant. Custom data is only `{ kind: "visa", reference_id }`.
3. Lemon redirects to `/visa/<reference_id>`. That page polls until the webhook marks the row paid, then shows the reading and Visa Wish Certificate. Visiting the URL alone shows nothing paid.
4. `POST /api/webhook` verifies the raw-body HMAC, is idempotent on the Lemon order id, unlocks on `order_created` (paid), and revokes a visa wish on `order_refunded`.
5. After a free reading, `/verdict/<id>` has a one-time offering (minimum $10, presets $10 / $15 / $25 / $50 / custom) on `LEMON_SQUEEZY_VARIANT_ID`. A holographic reminder is a joke and does not block the reading. Premium is offered for journal / daily / follow-ups.
6. Premium is `LEMON_SQUEEZY_PREMIUM_VARIANT_ID` ($10/month). Checkout stays disabled until an unchecked consent box is checked. Sign-in is a magic link (`SESSION_SECRET`). Journal routes 404 without a session.

Missing Lemon/auth credentials: the homepage still works; visa and Premium show in-page configuration errors.

## Environment variables

See `.env.example` for the full list with comments.

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_URL` | yes in prod | `https://sachapandit.com`. Use `http://localhost:3000` locally. |
| `NEXT_PUBLIC_BRAND_NAME` | no | Defaults to "Sacha Pandit". |
| `LEMON_SQUEEZY_API_KEY` | yes | Lemon → Settings → API. |
| `LEMON_SQUEEZY_STORE_ID` | yes | Numeric store id. |
| `LEMON_SQUEEZY_VARIANT_ID` | for certificates | Existing pay-what-you-want petition certificate. |
| `LEMON_SQUEEZY_VISA_VARIANT_ID` | for visa wishes | $10 Visa Wish Certificate variant. Price comes from the variant, never the client. |
| `LEMON_SQUEEZY_PREMIUM_VARIANT_ID` | for Premium | $10/month subscription variant. Recurring; no customPrice. |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | yes | Signing secret of the webhook endpoint. |
| `SESSION_SECRET` | for Premium login | HMAC for the sign-in cookie. |
| `SUPABASE_URL` | yes in prod | Project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes in prod | Server only. Never expose it to the browser. Locally, an in-memory store is used if these are empty. |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | no | Readings. If both empty, a local fallback pool is used. |
| `RESEND_API_KEY` | no | If empty, petition certificate email is skipped. |
| `RESEND_FROM_EMAIL` | no | `church@sachapandit.com` (domain must be verified). |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | no | Rate limits. Without them an in-memory limiter is used. |
| `SENTRY_DSN` | no | Empty disables Sentry. Events keep only `petition_id`, `certificate_no`, and `order_id`. |

## Supabase

1. Create a project.
2. In the SQL editor, run `002_petitions.sql`, `003_webhook_events.sql`, `004_visa_wishes.sql`, then `005_premium.sql`.
3. Copy the project URL and the service role key into `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

Row level security is on; anon and authenticated have no access. Only the server (service role) reads or writes. Never expose the service role key to the client.

`webhook_events` is an audit log: one row per webhook request (`issued`, `duplicate`, `revoked`, `ignored_event`, `not_paid`, `bad_signature`, `invalid_payload`, `db_error`). It never stores the raw body, wish, name, or email.

## Lemon Squeezy

### Petition certificate (existing)

Pay-what-you-want, **minimum $10 USD**, one-time (never a subscription). Copy the variant id into `LEMON_SQUEEZY_VARIANT_ID`. Checkout sends `customPrice` in cents ≥ 1000. Redirect and receipt URLs are set in code to `/certificate/<petitionId>`.

### Visa Wish Certificate ($10) — create this product

1. Create a **digital** product (not a physical good, not a subscription).
2. Suggested name (avoid the words "AI" and "approved"): **Visa Wish Certificate — Sacha Pandit Entertainment Artifact**
3. Price: **$10 USD**, one-time.
4. Description:

   > A digital entertainment certificate from Sacha Pandit. The buyer receives a personalized, AI-generated wish reading and a shareable Visa Wish Certificate. This is fictional entertainment. It is not a visa, not immigration advice, and not a government decision. Sacha Pandit cannot issue visas or influence immigration outcomes.

5. Confirmation / receipt: Lemon will use the redirect and receipt link URLs sent at checkout (`https://sachapandit.com/visa/<reference>`). You do not paste a single static success URL, because each wish has its own unguessable reference.
6. Copy the **variant id** into `LEMON_SQUEEZY_VISA_VARIANT_ID`.
7. Copy the signing secret into `LEMON_SQUEEZY_WEBHOOK_SECRET`.

The charged price always comes from the variant. The checkout request never sends `customPrice` for visa wishes.

### Sacha Pandit Premium ($10/month) — create this product

1. Create a **subscription** product, $10 USD / month.
2. Name: **Sacha Pandit Premium**.
3. Copy the variant id into `LEMON_SQUEEZY_PREMIUM_VARIANT_ID`. Add a checkout custom field `profile_id` if Lemon requires custom data keys to be declared.
4. Redirect/receipt URLs are set in code to `/journal`.

### Webhook events

Endpoint: `https://sachapandit.com/api/webhook`

- Tip/certificate and Visa: `order_created`, `order_refunded`
- Premium: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired` (also accepted: `subscription_paused`, `subscription_unpaused`, `subscription_resumed`, `subscription_payment_success`, `subscription_payment_failed`)

## Deploy

1. Push to GitHub, import into Vercel.
2. Add every env var above. Set `NEXT_PUBLIC_URL=https://sachapandit.com`.
3. Point the Lemon webhook at `https://sachapandit.com/api/webhook` with the order and subscription events listed above.
4. Check `https://sachapandit.com/api/health`.

## Health check

`GET /api/health` checks Supabase and Lemon Squeezy in parallel (5 second timeout each) and returns:

```json
{ "ok": true, "supabase": "ok", "lemon": "ok" }
```

Each value is `ok`, `down`, or `unconfigured`. Status is 200 when both are `ok`, otherwise 503.

## Testing webhooks

With `corepack pnpm dev` running and `LEMON_SQUEEZY_WEBHOOK_SECRET` plus the Supabase vars set in `.env.local`:

```bash
corepack pnpm test:webhook
corepack pnpm test:webhook --kind visa --reference vw_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
corepack pnpm test:webhook --event order_refunded --kind visa --order-id 12345
corepack pnpm test:webhook --kind premium --event subscription_created --profile-id aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

It signs the body with the same HMAC helper the webhook uses. A well-formed unpaid visa reference still shows nothing paid on `/visa/<reference>`. Send the same order id twice: the second response is still 200 (`duplicate`).

## Notes

- Never "visa approved". The result heading is **YOUR VISA WISH HAS BEEN RECEIVED BY SACHA PANDIT**.
- Do not share passport numbers or visa application numbers.
- Devanagari names on OG images are shaped with HarfBuzz (`lib/ogShape.ts`) when the name is Devanagari-only plus basic Latin.

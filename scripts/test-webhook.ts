// Assumptions: a local fake Lemon Squeezy delivery. It never talks to Lemon. It signs the exact serialized
// string with lib/webhookSignature.ts (the same helper the route verifies with) and POSTs that string.
// Reads LEMON_SQUEEZY_WEBHOOK_SECRET from the shell, or from .env.local if present. Only point --url at your own
// local dev server.
// Usage:
//   corepack pnpm test:webhook
//   corepack pnpm test:webhook --kind certificate --petition-id SOUL-ABCD-EF --name Ada
//   corepack pnpm test:webhook --kind visa --reference vw_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
//   corepack pnpm test:webhook --event order_refunded --kind visa --order-id 12345 --url http://localhost:3000/api/webhook

import { randomInt } from "node:crypto";
import { existsSync } from "node:fs";

import { generatePetitionId, isPetitionId } from "../lib/soul-id";
import { signBody } from "../lib/webhookSignature";

const VISA_REFERENCE = /^vw_[a-z2-7]{32}$/;

function isVisaReference(value: string): boolean {
  return VISA_REFERENCE.test(value);
}

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  return value && !value.startsWith("--") ? value : undefined;
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim();
if (!secret) {
  fail("LEMON_SQUEEZY_WEBHOOK_SECRET is not set. Add it to .env.local (same value the dev server uses) and retry.");
}

const url = flag("url") ?? "http://localhost:3000/api/webhook";
const eventName = flag("event") ?? "order_created";
const allowedEvents = new Set([
  "order_created",
  "order_refunded",
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_expired",
]);
if (!allowedEvents.has(eventName)) fail(`unknown --event "${eventName}".`);

const kind = flag("kind") ?? "certificate";
if (kind !== "certificate" && kind !== "visa" && kind !== "premium") fail(`--kind must be certificate, visa, or premium, got "${kind}".`);

const name = flag("name") ?? "Ada";
const petitionInput = flag("petition-id");
if (petitionInput && !isPetitionId(petitionInput.trim().toUpperCase())) fail(`--petition-id must look like SOUL-XXXX-XX, got "${petitionInput}".`);
const petitionId = petitionInput ? petitionInput.trim().toUpperCase() : generatePetitionId();

const referenceInput = flag("reference");
if (referenceInput && !isVisaReference(referenceInput)) fail(`--reference must look like vw_ plus 32 base32 chars, got "${referenceInput}".`);
const referenceId = referenceInput ?? "vw_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const orderId = flag("order-id") ?? String(Date.now()).slice(-7) + String(randomInt(100, 999));
const profileId = flag("profile-id") ?? "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const custom =
  kind === "visa"
    ? { kind: "visa", reference_id: referenceId }
    : kind === "premium"
      ? { kind: "premium", profile_id: profileId }
      : { kind: "certificate", petition_id: petitionId, name };

const payload = {
  meta: { event_name: eventName, test_mode: true, custom_data: custom },
  data: {
    type: kind === "premium" ? "subscriptions" : "orders",
    id: orderId,
    attributes: {
      status: kind === "premium" ? "active" : "paid",
      currency: "USD",
      total: kind === "visa" ? 1000 : kind === "premium" ? 1000 : 500,
      user_email: `test+${orderId}@example.com`,
      renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
};

const raw = JSON.stringify(payload);
const signature = signBody(raw, secret);

process.stdout.write(`POST ${url}\n${eventName} · ${kind} · order ${orderId}\n`);

async function main(): Promise<void> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-signature": signature },
      body: raw,
    });
  } catch {
    fail(`could not reach ${url}. is the dev server running? start it with: corepack pnpm dev`);
  }

  const body = await response.text();
  process.stdout.write(`status: ${response.status}\nbody: ${body}\n`);
  if (kind === "visa") process.stdout.write(`reference: ${referenceId}\npage: ${new URL(url).origin}/visa/${referenceId}\n`);
  else if (kind === "premium") process.stdout.write(`profile: ${profileId}\njournal: ${new URL(url).origin}/journal\n`);
  else process.stdout.write(`petitionId: ${petitionId}\ncertificate: ${new URL(url).origin}/certificate/${petitionId}\n`);
  if (!response.ok) process.exit(1);
}

void main();

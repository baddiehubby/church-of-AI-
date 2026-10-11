// Assumptions: Sentry events may only carry the allowlisted ids below. Everything else that could
// hold PII is dropped: request (body, cookies, headers, query string), user, and any tags/extra/contexts keys other
// than the allowlist (so name, email, raw wish, and bodies never survive). Breadcrumb data is filtered the same way
// and URLs lose their query string. No SDK imports so this file is unit-testable on its own.

const ALLOWED = new Set(["petition_id", "soul_id", "reference_id", "order_id", "tier", "event_name", "amount_cents"]);

type Bag = Record<string, unknown>;

function isBag(value: unknown): value is Bag {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pick(bag: unknown): Bag | undefined {
  if (!isBag(bag)) return undefined;
  const out: Bag = {};
  for (const [key, value] of Object.entries(bag)) {
    if (ALLOWED.has(key) && (typeof value === "string" || typeof value === "number")) out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

function pickContexts(contexts: unknown): Bag | undefined {
  if (!isBag(contexts)) return undefined;
  const out: Bag = {};
  for (const [key, value] of Object.entries(contexts)) {
    const kept = pick(value);
    if (kept) out[key] = kept;
  }
  return Object.keys(out).length ? out : undefined;
}

export function scrubBreadcrumb<T extends object>(crumb: T): T {
  const source = crumb as Bag;
  const copy: Bag = { ...source };
  const data = pick(source.data) ?? {};
  if (isBag(source.data) && typeof source.data.url === "string") {
    data.url = source.data.url.split("?")[0] ?? "";
  }
  if (Object.keys(data).length) copy.data = data;
  else delete copy.data;
  return copy as T;
}

export function scrubEvent<T extends object>(event: T): T {
  const source = event as Bag;
  const copy: Bag = { ...source };
  delete copy.request;
  delete copy.user;
  for (const key of ["tags", "extra"] as const) {
    const kept = pick(source[key]);
    if (kept) copy[key] = kept;
    else delete copy[key];
  }
  const contexts = pickContexts(source.contexts);
  if (contexts) copy.contexts = contexts;
  else delete copy.contexts;
  if (Array.isArray(source.breadcrumbs)) {
    copy.breadcrumbs = source.breadcrumbs.map((crumb: unknown) => (isBag(crumb) ? scrubBreadcrumb(crumb) : crumb));
  }
  return copy as T;
}

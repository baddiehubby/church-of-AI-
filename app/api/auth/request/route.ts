import { premium } from "@/content/premium";
import { sendMagicLinkEmail } from "@/lib/email";
import { appUrl } from "@/lib/env";
import { isRecord } from "@/lib/guards";
import { rateLimit } from "@/lib/rateLimit";
import { safeNext } from "@/lib/safeNext";
import { authConfigured, createLoginToken } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!authConfigured()) return Response.json({ error: premium.errors.unconfigured, code: "unconfigured" }, { status: 503 });
  const limit = await rateLimit(request, "auth", 5, 10 * 60 * 1000);
  if (!limit.ok) return Response.json({ error: premium.errors.rate }, { status: 429 });
  let email = "";
  let nextPath = "/";
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("json")) {
    const body: unknown = await request.json();
    email = isRecord(body) && typeof body.email === "string" ? body.email : "";
    nextPath = isRecord(body) ? safeNext(body.next) : "/";
  } else {
    const form = await request.formData();
    email = typeof form.get("email") === "string" ? String(form.get("email")) : "";
    nextPath = safeNext(form.get("next"));
  }
  const created = await createLoginToken(email);
  if ("error" in created) {
    return Response.json({ error: created.error === "email" ? premium.errors.email : premium.errors.unconfigured }, { status: 400 });
  }
  const next = nextPath === "/" ? "" : `&next=${encodeURIComponent(nextPath)}`;
  const url = `${appUrl()}/auth/callback?token=${encodeURIComponent(created.token)}${next}`;
  const emailed = await sendMagicLinkEmail({ to: created.email, url });
  const reveal = process.env.NODE_ENV !== "production" && !emailed;
  return Response.json({ ok: true, emailed, ...(reveal ? { devLink: url } : {}) });
}

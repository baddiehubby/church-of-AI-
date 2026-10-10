// Assumptions: one certificate renderer for three ids. A petition id renders the existing petition certificate
// (immutable cache). A private visa reference renders the full Visa Wish Certificate with the wish, only while
// the order is paid (no-store, so a refund takes effect). A public certificate number renders the share card
// without the wish text. ?download=1 adds an attachment filename. Unknown or unpaid ids are 404.

import { ImageResponse } from "next/og";

import { certificateCard } from "@/lib/certificate-card";
import { loadOgFonts } from "@/lib/ogFonts";
import { shapeDevanagariName } from "@/lib/ogShape";
import { getCertificate, getPetition } from "@/lib/petitions";
import { isPetitionId } from "@/lib/soul-id";
import { visaCard } from "@/lib/visa-card";
import { getSharedVisa, getVisaView, isCertificateNo, isVisaReference } from "@/lib/visaWishes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notFound = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

function day(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toISOString().slice(0, 10);
}

function attachment(download: boolean, name: string): Record<string, string> {
  return download ? { "Content-Disposition": `attachment; filename="${name}.png"` } : {};
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: raw } = await context.params;
  const decoded = decodeURIComponent(raw).trim();
  const download = new URL(request.url).searchParams.get("download") === "1";

  if (isVisaReference(decoded)) {
    const view = await getVisaView(decoded);
    if (view.state !== "paid") return notFound();
    const fonts = await loadOgFonts();
    const { certificate } = view;
    const nameImage = certificate.firstName ? await shapeDevanagariName(certificate.firstName, certificate.firstName.length > 18 ? 46 : 60, "#1A1740") : null;
    return new ImageResponse(
      visaCard({ ...certificate, issued: day(certificate.issuedAt), pandit: null, nameImage }),
      { width: 1200, height: 630, fonts, headers: { "Cache-Control": "private, no-store", ...attachment(download, `visa-wish-${certificate.certificateNo}`) } },
    );
  }

  const upper = decoded.toUpperCase();
  if (isCertificateNo(upper)) {
    const shared = await getSharedVisa(upper);
    if (!shared) return notFound();
    const fonts = await loadOgFonts();
    const nameImage = shared.firstName ? await shapeDevanagariName(shared.firstName, shared.firstName.length > 18 ? 46 : 60, "#1A1740") : null;
    return new ImageResponse(
      visaCard({ ...shared, issued: day(shared.issuedAt), wish: null, pandit: shared.reading?.panditReply ?? null, nameImage }),
      { width: 1200, height: 630, fonts, headers: { "Cache-Control": "public, max-age=300", ...attachment(download, `visa-wish-${shared.certificateNo}`) } },
    );
  }

  if (!isPetitionId(upper)) return notFound();
  const [certificate, petition] = await Promise.all([getCertificate(upper), getPetition(upper)]);
  if (!certificate || !petition) return notFound();
  const fonts = await loadOgFonts();
  const printedName = certificate.name ?? "ON THE RECORD";
  const nameImage = certificate.name ? await shapeDevanagariName(certificate.name, 54, "#1A1740") : null;
  return new ImageResponse(
    certificateCard({
      name: printedName,
      wish: petition.wish,
      status: petition.status,
      pandit: petition.panditReply ?? "acha, the stamp is the record, beta.",
      id: petition.petitionId,
      issued: day(certificate.issuedAt),
      nameImage,
    }),
    { width: 1200, height: 630, emoji: "twemoji", fonts, headers: { "Cache-Control": "public, immutable, max-age=31536000", ...attachment(download, `certificate-${upper}`) } },
  );
}

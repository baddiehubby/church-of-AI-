import type { Metadata } from "next";

import { CeremonyPage } from "@/components/CeremonyPage";
import { getCeremonyByToken } from "@/lib/ceremony";

export const metadata: Metadata = {
  title: "Private ceremony",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CeremonyRoute({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ceremony = await getCeremonyByToken(token).catch(() => null);
  return <CeremonyPage ceremony={ceremony} />;
}

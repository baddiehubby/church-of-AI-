import type { Metadata } from "next";
import { Suspense } from "react";

import { TransmissionArchive } from "@/components/TransmissionArchive";
import { readMarsSession } from "@/lib/marsAuth";
import { listArchiveForOwner } from "@/lib/transmissionsStore";

export const metadata: Metadata = {
  title: "Archive",
  description: "Your transmissions to Earth. Baba ji has read every one.",
};

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const session = await readMarsSession();
  const initial = session ? await listArchiveForOwner(session.ownerId).catch(() => null) : null;
  return (
    <Suspense fallback={null}>
      <TransmissionArchive initial={initial} />
    </Suspense>
  );
}

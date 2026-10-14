import type { Metadata } from "next";

import { InductionPage } from "@/components/InductionPage";
import { getInductionConfigStatus } from "@/lib/inductionConfig";
import { listConfiguredInductionPlans } from "@/lib/inductionPlans";
import { countFoundersInducted } from "@/lib/transmissionsStore";
import { FOUNDERS_CAP } from "@/lib/settlerTiers";

export const metadata: Metadata = {
  title: "The Induction",
  description: "Founder of the Red Path. 108 seats. A ceremony, not a subscription.",
};

export const dynamic = "force-dynamic";

export default async function InductionRoute() {
  const inducted = await countFoundersInducted().catch(() => 0);
  const remaining = Math.max(0, FOUNDERS_CAP - inducted);
  const config = getInductionConfigStatus();
  const plans = listConfiguredInductionPlans();
  const showConfigDiagnostic = process.env.NODE_ENV === "development" && !config.ready;

  return (
    <InductionPage
      remaining={remaining}
      checkoutReady={config.ready}
      plans={plans}
      missingConfig={showConfigDiagnostic ? config.missing : []}
      showConfigDiagnostic={showConfigDiagnostic}
    />
  );
}

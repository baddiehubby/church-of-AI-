import { brandName } from "@/lib/brand";

export const checkoutProduct = {
  name: `Official Petition Certificate — ${brandName()} Artifact`,
  receiptButton: "View the certificate",
  visaReceiptButton: "View your wish reading",
  premiumReceiptButton: "Open your journal",
  seatReceiptButton: "Return to the account",
  blessingReceiptButton: "Open your blessing",
  covenantReceiptButton: "Return to the temple",
} as const;

import { hologram } from "@/content/hologram";
import { certificateOffer } from "@/content/verdict";

export function OfferingSlip({ petitionId }: { petitionId: string }) {
  return (
    <div className="offering-slip mt-5 border border-[#B8894A] bg-[#F2EDE4] px-5 py-5 text-[#1A1740]">
      <p className="font-mono text-[0.65rem] tracking-[0.18em] text-[#8A6230]">{certificateOffer.slipKicker}</p>
      <p className="mt-2 font-mono text-xs tracking-[0.12em]">{certificateOffer.slipStatus}</p>
      <p className="mt-3 font-mono text-sm tracking-[0.08em]">SOUL ID {petitionId}</p>
      <p className="mt-4 font-mono text-xs leading-relaxed tracking-[0.04em]">{certificateOffer.slipAlgo}</p>
      <p className="serif-warm mt-3 text-base italic">{hologram.offeringReceived}</p>
      <p className="serif-warm mt-2 text-base italic">{certificateOffer.slipPandit}</p>
    </div>
  );
}

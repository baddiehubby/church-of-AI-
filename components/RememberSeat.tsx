import { seatCopy } from "@/content/seat";

export function RememberSeat({ className = "" }: { className?: string }) {
  return (
    <form action="/api/stripe/checkout" method="post" className={`text-center ${className}`}>
      <p className="font-playfair text-sm italic text-bone">{seatCopy.remember}</p>
      <input type="hidden" name="tier" value="believer" />
      <button type="submit" className="btn-outline press mt-3">
        {seatCopy.rememberCta}
      </button>
    </form>
  );
}

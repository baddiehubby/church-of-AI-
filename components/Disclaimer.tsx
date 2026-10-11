import { crisisNotice, disclaimer } from "@/content/site";

// Void: mist #D2D0DC on deep indigo #1B1B4B is about 10:1 (well above 4.5:1). Cream: slate on aged paper.

export function Disclaimer({ surface = "cream", className = "" }: { surface?: "cream" | "void"; className?: string }) {
  const tone = surface === "void" ? "text-[#D2D0DC]" : "text-[#5C5868]";
  return (
    <div className={`max-w-3xl text-xs leading-relaxed ${tone} ${className}`}>
      <p>{disclaimer}</p>
      <p className="mt-2">{crisisNotice}</p>
    </div>
  );
}

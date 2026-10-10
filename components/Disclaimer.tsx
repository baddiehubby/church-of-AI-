import { disclaimer } from "@/content/site";

export function Disclaimer({ surface = "cream", className = "" }: { surface?: "cream" | "void"; className?: string }) {
  const tone = surface === "void" ? "text-[#D2D0DC]" : "text-[#1A1740]";
  return <p className={`max-w-3xl text-sm leading-relaxed ${tone} ${className}`}>{disclaimer}</p>;
}

"use client";

import { usePathname } from "next/navigation";

// The temple pages are the whole night. The register nav stays on every other page.

export function HomeChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (
    path === "/" ||
    path.startsWith("/altar") ||
    path.startsWith("/story") ||
    path.startsWith("/sermons") ||
    path.startsWith("/archive") ||
    path.startsWith("/letter") ||
    path.startsWith("/blessing") ||
    path.startsWith("/offerings") ||
    path.startsWith("/wall") ||
    path.startsWith("/monument") ||
    path.startsWith("/patrons")
  ) {
    return null;
  }
  return children;
}

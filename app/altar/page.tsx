import type { Metadata, Viewport } from "next";

import { TempleLanding } from "@/components/TempleLanding";
import { temple } from "@/content/temple";

export const metadata: Metadata = {
  title: "The altar",
  description: temple.placeholder,
};

export const viewport: Viewport = {
  themeColor: "#0A0E27",
};

export default function AltarPage() {
  return <TempleLanding />;
}

// Assumptions: fonts from next/font/google at build time (Fraunces serif for Pandit ji and display, Inter body,
// JetBrains Mono for the Algorithm). Header, footer (with the exact disclaimer), and grain wrap every page.

import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

import { GrainOverlay } from "@/components/GrainOverlay";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/content/site";
import { appUrl } from "@/lib/brand";

import "./globals.css";

const serif = Fraunces({ subsets: ["latin"], weight: ["500", "800"], style: ["normal", "italic"], variable: "--font-fraunces", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: site.title, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { title: site.title, description: site.description, siteName: site.name, type: "website" },
  twitter: { card: "summary", title: site.title, description: site.description },
};

export const viewport: Viewport = {
  themeColor: "#1B1B4B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="antialiased">
        <a href="#content" className="skip-link">
          {site.skip}
        </a>
        <GrainOverlay />
        <SiteHeader />
        <main id="content" tabIndex={-1} className="relative z-10 outline-none">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}

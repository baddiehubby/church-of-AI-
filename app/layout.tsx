// Fonts: Anton titles, Playfair for Baba ji, JetBrains Mono for the Algorithm, Inter body.
// Fraunces remains for legacy display. Header/footer carry the exact disclaimer; grain wraps every page.

import type { Metadata, Viewport } from "next";
import { Anton, Fraunces, Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";

import { GrainOverlay } from "@/components/GrainOverlay";
import { HomeChrome } from "@/components/HomeChrome";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/content/site";
import { appUrl } from "@/lib/brand";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "800"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});
const body = Inter({ subsets: ["latin"], variable: "--font-body-face", display: "swap" });
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono-face",
  display: "swap",
});
const display = Anton({ subsets: ["latin"], weight: "400", variable: "--font-display-face", display: "swap" });
const baba = Playfair_Display({
  subsets: ["latin"],
  weight: ["500"],
  style: ["normal", "italic"],
  variable: "--font-baba-face",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: site.title, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { title: site.title, description: site.description, siteName: site.name, type: "website" },
  twitter: { card: "summary", title: site.title, description: site.description },
};

export const viewport: Viewport = {
  themeColor: "#0A0E27",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${body.variable} ${mono.variable} ${display.variable} ${baba.variable}`}
    >
      <body className="antialiased">
        <a href="#content" className="skip-link">
          {site.skip}
        </a>
        <GrainOverlay />
        <HomeChrome>
          <SiteHeader />
        </HomeChrome>
        <main id="content" tabIndex={-1} className="relative z-10 outline-none">
          {children}
        </main>
        <HomeChrome>
          <SiteFooter />
        </HomeChrome>
      </body>
    </html>
  );
}

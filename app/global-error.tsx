"use client";

// Assumptions: replaces the root layout on fatal errors, so it inlines styles and repeats the disclaimer.

import { disclaimer, site } from "@/content/site";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#1B1B4B", color: "#F2EDE4", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 560, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
          <h1 style={{ fontFamily: "ui-monospace, monospace", fontSize: 24, letterSpacing: 2 }}>{site.errorTitle}</h1>
          <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 16, lineHeight: 1.6 }}>{site.errorBody}</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 24,
              background: "#6E1E23",
              color: "#F2EDE4",
              border: "1px solid #B8894A",
              minHeight: 48,
              padding: "0 24px",
              fontFamily: "ui-monospace, monospace",
              letterSpacing: 2,
              fontSize: 14,
            }}
          >
            {site.errorCta}
          </button>
        </main>
        <footer style={{ padding: "32px 20px 48px", maxWidth: 760, margin: "0 auto" }}>
          <p style={{ fontSize: 12, lineHeight: 1.6, color: "#D2D0DC" }}>{disclaimer}</p>
        </footer>
      </body>
    </html>
  );
}

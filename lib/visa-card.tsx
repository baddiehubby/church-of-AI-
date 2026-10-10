// Assumptions: Satori layouts for the Visa Wish Certificate (private download, includes the wish) and the share
// card (no wish text). Same paper/brass/indigo language as certificate-card.tsx. The printed reference is the
// public certificate number, never the private link token. Never says "approved".

import { disclaimer } from "@/content/site";
import { visaSuccess } from "@/content/visa";
import type { ShapedName } from "@/lib/ogShape";
import { clipText } from "@/lib/verdict-card";

type CardInput = {
  certificateNo: string;
  categoryLabel: string;
  country: string;
  firstName: string | null;
  issued: string;
  wish: string | null;
  pandit: string | null;
  nameImage?: ShapedName | null;
};

const label = { display: "flex", fontFamily: "Mono", fontSize: 15, letterSpacing: 3, color: "#6E1E23" } as const;
const value = { display: "flex", fontFamily: "Mono", fontSize: 24, fontWeight: 700, color: "#1A1740" } as const;

function Field({ name, text }: { name: string; text: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginRight: 44 }}>
      <div style={label}>{name}</div>
      <div style={{ ...value, marginTop: 4 }}>{text}</div>
    </div>
  );
}

export function visaCard(input: CardInput) {
  const title = input.firstName ? input.firstName.toUpperCase() : "ON THE RECORD";
  return (
    <div style={{ width: "1200px", height: "630px", display: "flex", background: "#1B1B4B", padding: "28px" }}>
      <div
        style={{
          width: "1144px",
          height: "574px",
          display: "flex",
          flexDirection: "column",
          background: "#F4E7D4",
          color: "#1A1740",
          border: "8px solid #B8894A",
          padding: "26px 44px 22px 44px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontFamily: "Mono", fontSize: 20, letterSpacing: 6, fontWeight: 700 }}>SACHA PANDIT</div>
          <div style={{ display: "flex", fontFamily: "Mono", fontSize: 16, letterSpacing: 3, color: "#6E1E23" }}>VISA WISH CERTIFICATE</div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 14,
            background: "#1B1B4B",
            color: "#E2C48A",
            fontFamily: "Mono",
            fontSize: 17,
            letterSpacing: 3,
            padding: "8px 14px",
            justifyContent: "center",
          }}
        >
          {visaSuccess.banner}
        </div>
        <div style={{ display: "flex", fontFamily: "Display", fontWeight: 900, fontSize: title.length > 18 ? 46 : 60, lineHeight: 1.05, marginTop: 18 }}>
          {input.nameImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- Satori OG image, pre-shaped Devanagari outlines
            <img src={input.nameImage.src} width={input.nameImage.width} height={input.nameImage.height} alt="" />
          ) : (
            title
          )}
        </div>
        {input.wish ? (
          <div style={{ display: "flex", fontFamily: "Noto Sans", fontSize: 25, lineHeight: 1.3, marginTop: 10, color: "#3A3458" }}>
            {`“${clipText(input.wish, 150)}”`}
          </div>
        ) : input.pandit ? (
          <div style={{ display: "flex", fontFamily: "Display", fontStyle: "italic", fontWeight: 600, fontSize: 28, lineHeight: 1.3, marginTop: 10, color: "#3A3458" }}>
            {clipText(input.pandit, 140)}
          </div>
        ) : null}
        <div style={{ display: "flex", flex: 1 }} />
        <div style={{ display: "flex", borderTop: "2px solid #B8894A", paddingTop: 14 }}>
          <Field name={visaSuccess.labels.category} text={input.categoryLabel.toUpperCase()} />
          <Field name={visaSuccess.labels.country} text={input.country.toUpperCase()} />
          <Field name={visaSuccess.labels.reference} text={input.certificateNo} />
          <Field name={visaSuccess.labels.issued} text={input.issued} />
        </div>
        <div style={{ display: "flex", fontFamily: "Noto Sans", fontSize: 14, lineHeight: 1.35, marginTop: 12, color: "#3A3458" }}>{disclaimer}</div>
      </div>
    </div>
  );
}

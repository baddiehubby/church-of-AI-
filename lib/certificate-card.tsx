import type { ShapedName } from "@/lib/ogShape";
import { clipText } from "@/lib/verdict-card";

export function certificateCard(input: {
  name: string;
  wish: string;
  status: string;
  pandit: string;
  id: string;
  issued: string;
  nameImage?: ShapedName | null;
}) {
  return (
    <div style={{ width: "1200px", height: "630px", display: "flex", background: "#1B1B4B", padding: "36px", position: "relative" }}>
      <div style={{ width: "1128px", height: "558px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F4E7D4", color: "#1A1740", padding: "36px 48px", border: "8px solid #B8894A" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontFamily: "Mono", fontSize: 18, letterSpacing: 3, color: "#6E1E23" }}>PETITION CERTIFICATE</div>
          <div style={{ display: "flex", fontFamily: "Mono", fontSize: 18, color: "#6E1E23" }}>{input.issued}</div>
        </div>
        <div style={{ display: "flex", fontFamily: "Display", fontSize: 54, fontWeight: 900, lineHeight: 1 }}>
          {input.nameImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- Satori OG image, pre-shaped Devanagari outlines
            <img src={input.nameImage.src} width={input.nameImage.width} height={input.nameImage.height} alt="" />
          ) : (
            input.name
          )}
        </div>
        <div style={{ display: "flex", fontFamily: "Noto Sans", fontSize: 28, lineHeight: 1.3 }}>{`“${clipText(input.wish, 90)}”`}</div>
        <div style={{ display: "flex", fontFamily: "Mono", fontSize: 26 }}>{input.status}</div>
        <div style={{ display: "flex", fontFamily: "Display", fontStyle: "italic", fontWeight: 600, fontSize: 28, color: "#3A3458" }}>{input.pandit}</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontFamily: "Mono", fontSize: 18 }}>{input.id}</div>
          <div style={{ display: "flex", fontFamily: "Noto Sans", fontSize: 16, color: "#6E1E23" }}>SACHA PANDIT · ENTERTAINMENT ONLY</div>
        </div>
      </div>
    </div>
  );
}

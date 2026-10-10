export function clipText(value: string, max: number): string {
  const chars = Array.from(value);
  if (chars.length <= max) return value;
  return `${chars.slice(0, max - 1).join("")}…`;
}

export function verdictCard(input: { id: string; wish: string; status: string; sacrifices: string[]; pandit: string; host: string }) {
  const statusSize = input.status.length > 28 ? 44 : 56;
  const panditSize = input.pandit.length > 110 ? 30 : input.pandit.length > 70 ? 36 : 42;
  const wish = clipText(input.wish, 80);
  return (
    <div style={{ width: "1200px", height: "630px", display: "flex", background: "#1B1B4B", position: "relative" }}>
      <div style={{ width: "720px", height: "630px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F4E7D4", color: "#1A1740", padding: "42px 40px" }}>
        <div style={{ display: "flex", fontFamily: "Noto Sans", fontSize: 28, lineHeight: 1.3, color: "#3A3458" }}>{`“${wish}”`}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Mono", fontSize: 18, letterSpacing: 3, color: "#6E1E23" }}>STATUS</div>
          <div style={{ display: "flex", fontFamily: "Display", fontSize: statusSize, fontWeight: 900, lineHeight: 1.05, marginTop: 10 }}>{input.status}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Mono", fontSize: 18, letterSpacing: 3, color: "#6E1E23" }}>REQUIRED SACRIFICES</div>
          {input.sacrifices.slice(0, 3).map((item, index) => (
            <div key={`${index}-${item}`} style={{ display: "flex", fontFamily: "Mono", fontSize: 28, marginTop: 8 }}>{item}</div>
          ))}
        </div>
      </div>
      <div style={{ width: "480px", height: "630px", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "42px 36px", background: "#1B1B4B" }}>
        <div style={{ display: "flex", fontFamily: "Mono", fontSize: 20, letterSpacing: 3, color: "#E2C48A" }}>SACHA PANDIT</div>
        <div style={{ display: "flex", fontFamily: "Display", fontStyle: "italic", fontWeight: 600, fontSize: panditSize, lineHeight: 1.25, color: "#F2EDE4" }}>{input.pandit}</div>
        <div style={{ display: "flex", fontFamily: "Mono", fontSize: 18, color: "#E2C48A" }}>{`${input.id} · ${input.host}`}</div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: "1200px", height: "630px", display: "flex", backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 4px)" }} />
    </div>
  );
}

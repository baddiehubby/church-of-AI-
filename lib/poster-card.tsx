export function clipPoster(value: string, max: number): string {
  const chars = Array.from(value);
  if (chars.length <= max) return value;
  return `${chars.slice(0, max - 1).join("")}…`;
}

export function sermonPoster(input: { title: string; week: string; soulId: string }) {
  const title = clipPoster(input.title, 42);
  return (
    <div style={{ width: "1200px", height: "630px", display: "flex", background: "#1B1B4B" }}>
      <div style={{ width: "760px", height: "630px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F4E7D4", padding: "48px" }}>
        <div style={{ display: "flex", fontFamily: "Mono", fontSize: 22, letterSpacing: 4, color: "#9B2335" }}>CHURCH OF AI</div>
        <div style={{ display: "flex", fontFamily: "Display", fontSize: title.length > 28 ? 52 : 64, fontWeight: 900, lineHeight: 1.05, color: "#1A1740" }}>{title}</div>
        <div style={{ display: "flex", fontFamily: "Mono", fontSize: 24, color: "#8A6230" }}>{`WEEK OF ${input.week}`}</div>
      </div>
      <div style={{ width: "440px", height: "630px", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 36px", background: "#0F6E6B" }}>
        <div style={{ display: "flex", fontFamily: "Mono", fontSize: 20, letterSpacing: 3, color: "#E2C48A" }}>SERMON</div>
        <div style={{ display: "flex", fontFamily: "Display", fontStyle: "italic", fontSize: 40, color: "#F2EDE4" }}>pandit ji</div>
        <div style={{ display: "flex", fontFamily: "Mono", fontSize: 22, color: "#F2EDE4" }}>{input.soulId}</div>
      </div>
    </div>
  );
}

export function darshanPoster(input: { soulId: string; when: string }) {
  return (
    <div style={{ width: "1200px", height: "630px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0F0E2E", padding: "56px" }}>
      <div style={{ display: "flex", fontFamily: "Mono", fontSize: 22, letterSpacing: 4, color: "#E2C48A" }}>CHURCH OF AI</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontFamily: "Mono", fontSize: 22, letterSpacing: 3, color: "#0F6E6B" }}>PRIVATE SCREENING</div>
        <div style={{ display: "flex", fontFamily: "Display", fontSize: 84, fontWeight: 900, color: "#F2EDE4", marginTop: 12 }}>DARSHAN</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Mono", fontSize: 22, color: "#E2C48A" }}>
        <div style={{ display: "flex" }}>{input.soulId}</div>
        <div style={{ display: "flex" }}>{input.when}</div>
      </div>
    </div>
  );
}

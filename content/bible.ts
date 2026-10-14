// Project bible facts for copy and UI. Not shown as a page.
// Voices and rules live in .cursorrules; keep this file in sync when either changes.

export const bible = {
  product: "Baba ji on Mars",
  what: "A cinematic ritual. Not a chatbot. Not a dashboard. Not a real religion.",
  northStar:
    "Prestige sci-fi intimacy: Mars loneliness, an old storyteller, a forgotten shrine at the edge of settlement.",
  babaJi: {
    sols: 4000,
    ship: "second colony ship",
    arrival: "He was meditating when his pod crashed on Mars. He survived.",
    habitat: "Habitat 47",
    line: "beta, sit with this one.",
    pauseOdds: "1 in 20",
    asset: "/images/baba-ji-seated.webp",
    fallback: "/images/baba-ji-seated.jpg",
  },
  environment: {
    horizon: "/images/mars-horizon.webp",
    fallback: "/images/mars-horizon.jpg",
  },
  palette: {
    marsRed: "#C8102E",
    bone: "#F4EDE0",
    night: "#0A0E27",
    gold: "#FFB627",
    dust: "#B8865C",
    signal: "#00C8FF",
    ink: "#171725",
  },
  type: {
    titles: "Anton",
    babaJi: "Playfair Display",
    algorithm: "JetBrains Mono",
    body: "Inter",
  },
  beatMs: 800,
  grainOpacity: 0.07,
} as const;

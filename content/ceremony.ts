// Private founder ceremony script. Fiction. Never a real blessing.

export const ceremonyCopy = {
  title: "your private ceremony",
  loading: "the dust is settling…",
  missing: "this ceremony is not on the record.",
  signed: "— baba ji",
  videoPending: "the film is still being cut. the words below are yours now.",
  videoReady: "sit. three minutes. no one else will see this.",
} as const;

export type CeremonyScriptInput = {
  name: string;
  settlerId: string;
  solOfArrival: number;
  firstTransmission: string | null;
  position: number;
};

/** Three-minute spoken script for the inductee. Lowercase. Warm. Tired. */
export function composeCeremonyScript(input: CeremonyScriptInput): string {
  const name = input.name.trim() || "settler";
  const first =
    input.firstTransmission?.trim().slice(0, 160) ||
    "you arrived without a first transmission. that is fine. the dust still knows your weight.";

  return [
    "the altar is red tonight. dust drifts like it has somewhere else to be.",
    "",
    `${name}.`,
    "",
    `you are ${input.settlerId}. you arrived on Sol ${input.solOfArrival}.`,
    `your first words were: “${first}”`,
    "",
    `the book has you as founder ${input.position} of 108.`,
    "no more will follow after the last seat fills. that is the point.",
    "",
    "you are a founder of the red path. welcome home, bacha.",
    "",
    "— baba ji",
  ].join("\n");
}

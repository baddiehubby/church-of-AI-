import { describe, expect, it } from "vitest";

import { fewShotVerdicts, occupiedVerdict } from "./fewShots";
import { VERDICT_SYSTEM_PROMPT } from "./verdictPrompt";
import { verdictSchema } from "./verdictSchema";

describe("verdictSchema", () => {
  it("parses the official prompt examples", () => {
    const lines = VERDICT_SYSTEM_PROMPT.split("\n").filter((line) => line.startsWith('{"algo_status"'));
    expect(lines).toHaveLength(5);
    lines.forEach((line, index) => {
      const parsed = verdictSchema.safeParse(JSON.parse(line));
      expect(parsed.success).toBe(true);
      expect(fewShotVerdicts[index]).toEqual(JSON.parse(line));
    });
  });

  it("parses the occupied fallback", () => {
    expect(verdictSchema.safeParse(occupiedVerdict).success).toBe(true);
  });
});

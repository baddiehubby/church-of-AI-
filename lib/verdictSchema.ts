import { z } from "zod";

export const verdictStatuses = [
  "UNDER CONSIDERATION",
  "PROVISIONALLY ACCEPTED",
  "REQUIRES FURTHER PETITION",
  "FLAGGED FOR REVIEW BY THE ALGORITHM",
] as const;

export const verdictProbabilities = ["CLASSIFIED", "NON-ZERO", "PENDING", "UNKNOWABLE"] as const;

function words(value: string): string[] {
  return value.trim().split(/\s+/).filter(Boolean);
}

function formalLine(value: string): boolean {
  if (/[!]/.test(value)) return false;
  if (/\bI\b/.test(value)) return false;
  if (/\b(?:I'm|I've|don't|can't|won't|it's|that's|isn't|aren't|didn't|doesn't)\b/i.test(value)) return false;
  return true;
}

export const verdictSchema = z
  .object({
    algo_status: z.enum(verdictStatuses),
    algo_sacrifices: z.array(z.string().min(2).max(80)).length(3),
    algo_counsel: z.string().min(40).max(600),
    algo_probability: z.enum(verdictProbabilities),
    pandit_reply: z.string().min(8).max(240),
  })
  .strict()
  .superRefine((value, ctx) => {
    const algorithm = `${value.algo_counsel}\n${value.algo_sacrifices.join("\n")}`;
    if (!formalLine(algorithm)) ctx.addIssue({ code: "custom", path: ["algo_counsel"], message: "formal" });
    value.algo_sacrifices.forEach((item, index) => {
      const count = words(item).length;
      // The prompt asks for 2-6 words. Two official examples run to 7 and 8, so 2-8 is accepted.
      if (count < 2 || count > 8) ctx.addIssue({ code: "custom", path: ["algo_sacrifices", index], message: "words" });
    });
    const reply = value.pandit_reply;
    const lowered = reply.replaceAll("Algorithm", "algorithm");
    if (lowered !== lowered.toLowerCase() || /[\r\n]/.test(reply) || /\p{Extended_Pictographic}/u.test(reply)) {
      ctx.addIssue({ code: "custom", path: ["pandit_reply"], message: "line" });
    }
    const count = words(reply).length;
    if (count < 8 || count > 40) ctx.addIssue({ code: "custom", path: ["pandit_reply"], message: "words" });
  });

export type Verdict = z.infer<typeof verdictSchema>;

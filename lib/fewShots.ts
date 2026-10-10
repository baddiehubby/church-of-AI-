import type { Verdict } from "@/lib/verdictSchema";

export const fewShotVerdicts = [
  {
    algo_status: "REQUIRES FURTHER PETITION",
    algo_sacrifices: ["1 unsent message", "3 evenings of silence", "the willingness to be wrong"],
    algo_counsel:
      "You are asking the universe for a specific person. The universe is asking you for a specific change. These are not the same request.",
    algo_probability: "UNKNOWABLE",
    pandit_reply: "beta, the Algorithm wants three evenings of silence. honestly? it's being generous. sit down.",
  },
  {
    algo_status: "UNDER CONSIDERATION",
    algo_sacrifices: ["2 passport photos", "4 cups of chai", "the belief that timing is under your control"],
    algo_counsel:
      "The petition has been logged. The queue is long. The queue has always been long. The Algorithm suggests patience and a warmer jacket.",
    algo_probability: "PENDING",
    pandit_reply: "acha, so you want snow. we'll see how you feel in february, beta.",
  },
  {
    algo_status: "PROVISIONALLY ACCEPTED",
    algo_sacrifices: ["1 boring year", "2 missed weddings", "the idea that you are owed this"],
    algo_counsel:
      "Wealth is a lagging indicator of decisions made quietly. The Algorithm does not distribute money. The Algorithm distributes consequences.",
    algo_probability: "NON-ZERO",
    pandit_reply: "haan, everyone wants this. the ones who get it stopped asking me for it.",
  },
  {
    algo_status: "UNDER CONSIDERATION",
    algo_sacrifices: ["4 hours of scrolling", "1 honest study plan", "the fantasy of last-minute brilliance"],
    algo_counsel:
      "The exam does not care about your intentions. The exam cares about your hours. The Algorithm suggests a quieter phone.",
    algo_probability: "NON-ZERO",
    pandit_reply: "beta, put the phone down. even the Algorithm knows that one.",
  },
  {
    algo_status: "FLAGGED FOR REVIEW BY THE ALGORITHM",
    algo_sacrifices: ["3 first dates", "the list of requirements", "the story that you are too busy"],
    algo_counsel:
      "You are asking for a person. The Algorithm suggests you first become a person someone could find. This is not a punishment. This is an entry requirement.",
    algo_probability: "NON-ZERO",
    pandit_reply: "acha, so you're finally ready. good. took you long enough, beta.",
  },
] as const satisfies readonly Verdict[];

export const occupiedVerdict = {
  algo_status: "UNDER CONSIDERATION",
  algo_sacrifices: ["1 moment of quiet", "2 deep breaths", "the willingness to wait"],
  algo_counsel: "The Algorithm is occupied. The petition has been noted. Return in a moment.",
  algo_probability: "PENDING",
  pandit_reply: "acha, the Algorithm is busy. sit for a minute, beta.",
} as const satisfies Verdict;

export const extraPoolVerdicts = [
  {
    algo_status: "REQUIRES FURTHER PETITION",
    algo_sacrifices: ["1 closed notebook", "2 early mornings", "the myth of the perfect draft"],
    algo_counsel:
      "A degree is a record of hours, not a mood. The petition asks for a result. The file contains only an intention.",
    algo_probability: "PENDING",
    pandit_reply: "beta, the thesis does not care that you are tired. open the notebook.",
  },
  {
    algo_status: "UNDER CONSIDERATION",
    algo_sacrifices: ["1 honest apology", "3 unhurried walks", "the habit of performing fine"],
    algo_counsel:
      "The wish names a feeling and not a person. Feelings do not sign receipts. The Algorithm files the request beside the work of staying.",
    algo_probability: "CLASSIFIED",
    pandit_reply: "acha, you want to be chosen. start by staying when it is ordinary, beta.",
  },
  {
    algo_status: "PROVISIONALLY ACCEPTED",
    algo_sacrifices: ["1 quiet Sunday", "2 unfinished lists", "the need to be impressive"],
    algo_counsel:
      "The petition is vague, and vague petitions still take a number. The Algorithm cannot grant a mood. It can only ask what the wish is for.",
    algo_probability: "NON-ZERO",
    pandit_reply: "yaar, a wish with no shape is just weather. name the thing and then we file it, beta.",
  },
] as const satisfies readonly Verdict[];

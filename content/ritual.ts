// Hardcoded transmission scene for this stage. Pools wire later.

export const ritualCopy = {
  logged: "TRANSMISSION LOGGED.",
  response: "EARTH RESPONSE TIME: 24 MINUTES MINIMUM.",
  noReply: "NO REPLY EXPECTED.",
  opening: "beta, sit with this one.",
  spokenKicker: "THE ALGORITHM HAS SPOKEN",
  status: "UNDER CONSIDERATION",
  counsel:
    "THE COLONY HAS RECEIVED YOUR PETITION. THE COLONY IS CONSIDERING IT. RETURN IN ONE SOL.",
  probability: "PROBABILITY: PENDING",
  translation: "translation: you already know.",
  forecastKicker: "BABA JI FORECASTS",
  forecast: "you will check the distance to Earth more than once today. it will not have changed.",
  confidence: "confidence: under observation",
  preserve: "[ preserve this transmission ]",
  preserved: "preserved.",
  share: "[ share the scene ]",
  returnAltar: "return to the altar",
  shared: "scene copied.",
  signalFail: "the signal didn't reach us. try again, beta.",
} as const;

export const ritualLog = [ritualCopy.logged, ritualCopy.response, ritualCopy.noReply] as const;

export const RITUAL_EASE = [0.16, 1, 0.3, 1] as const;

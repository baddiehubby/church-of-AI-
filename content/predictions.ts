// Assumptions: fifty fictional asides. Never a granted wish, never medical/legal/death, never "visa approved".
// Algorithm lines are ALL CAPS, no contractions, no first person, no exclamation marks. Pandit ji is one
// lowercase line. They never agree. Entertainment only.

export type Prediction = {
  algorithm: string;
  pandit: string;
};

export const PREDICTION_COUNT = 50;

export const predictionAside = {
  kicker: "A SIDE NOTE FROM THE DESK",
  note: "Fictional entertainment. Not a verdict. Not a granted wish.",
} as const;

export const PREDICTIONS: readonly Prediction[] = [
  {
    algorithm: "A TAB LEFT OPEN WILL ASK TO BE CLOSED. THE DESK TAKES NO POSITION ON WHETHER ANYONE OBEYS.",
    pandit: "acha, you already know which tab. close it after tea, beta.",
  },
  {
    algorithm: "A QUEUE WILL MOVE. THE SPEED OF THE QUEUE IS NOT A VERDICT.",
    pandit: "the line always looks longer from the back. sit if you can.",
  },
  {
    algorithm: "A MESSAGE DRAFTED AND UNSENT REMAINS A DRAFT. NO OUTCOME IS ATTACHED.",
    pandit: "write it, then wait one cup of chai before you send.",
  },
  {
    algorithm: "A JOURNEY MAY PAUSE AT A GATE. DELAY IS WEATHER, NOT DESTINY.",
    pandit: "pack the snack you forgot last time. the gate will still be there.",
  },
  {
    algorithm: "A MEETING MAY END EARLIER THAN THE CALENDAR CLAIMS. THAT IS NOT A PROMOTION.",
    pandit: "leave one slide out, beta. they never read the last one anyway.",
  },
  {
    algorithm: "A KIND NOTE MAY ARRIVE. KINDNESS IS NOT A CONTRACT.",
    pandit: "reply when you mean it. the desk has seen rushed hearts before.",
  },
  {
    algorithm: "A COIN MAY BE FOUND IN A POCKET. THE DESK DOES NOT CALL THAT FORTUNE.",
    pandit: "count it, then buy tea. luck is a small thing today.",
  },
  {
    algorithm: "A PHONE WILL BUZZ FOR A REASON SMALLER THAN THE STARTLE.",
    pandit: "check it once. then put it face down, beta.",
  },
  {
    algorithm: "A KEY WILL BE WHERE IT WAS LEFT. SEARCHING DOES NOT RELOCATE IT.",
    pandit: "look by the bowl near the door. you always leave it there.",
  },
  {
    algorithm: "LAUNDRY WILL DRY ON ITS OWN SCHEDULE. THE SCHEDULE IS NOT A SIGN.",
    pandit: "one more cycle will not make the day kinder. fold what is dry.",
  },
  {
    algorithm: "A CUP WILL COOL IF LEFT. HEAT IS NOT A PROMISE.",
    pandit: "drink it while it is still itself. later it is only a cup.",
  },
  {
    algorithm: "A CALENDAR SQUARE WILL FILL. FILLING A SQUARE IS NOT ARRIVAL.",
    pandit: "leave one afternoon empty, beta. the week already talks too much.",
  },
  {
    algorithm: "A TRAIN MAY BE ON TIME. PUNCTUALITY IS LOGISTICS, NOT BLESSING.",
    pandit: "stand where the doors actually open. you know this.",
  },
  {
    algorithm: "A PASSWORD WILL BE FORGOTTEN AND THEN REMEMBERED. NEITHER EVENT IS FATE.",
    pandit: "it is the one you used in 2019. do not invent a new life for it.",
  },
  {
    algorithm: "A PLANT WILL LEAN TOWARD THE WINDOW. LIGHT IS THE ONLY INSTRUCTION.",
    pandit: "turn the pot a little. it has been staring at the same street.",
  },
  {
    algorithm: "A NEIGHBOR MAY SAY HELLO. GREETING IS NOT A PLOT.",
    pandit: "say hello back. then go home. that is enough for a hallway.",
  },
  {
    algorithm: "EVENING LIGHT WILL CHANGE THE ROOM. THE ROOM REMAINS THE ROOM.",
    pandit: "sit by the window a minute. the lamp can wait.",
  },
  {
    algorithm: "HEADPHONES WILL TANGLE IF STORED IN HASTE. HASTE IS THE ONLY CAUSE.",
    pandit: "wrap them slowly tonight. tomorrow-you is already tired.",
  },
  {
    algorithm: "LEFTOVERS WILL DECIDE THE NEXT MEAL. DECISION IS NOT LUCK.",
    pandit: "eat the rice first. the rest has been patient enough.",
  },
  {
    algorithm: "AN UMBRELLA MAY BE CARRIED ON A CLEAR DAY. THE SKY IS NOT OBLIGED.",
    pandit: "take it anyway. the bag is already heavy with smaller worries.",
  },
  {
    algorithm: "SLEEP WILL ARRIVE AFTER THE LAST REPLAYED SENTENCE. THE SENTENCE IS NOT A CASE FILE.",
    pandit: "the argument already ended, beta. let the pillow have the last word.",
  },
  {
    algorithm: "AN EMAIL MARKED URGENT MAY WAIT UNTIL MORNING. URGENCY IS A STYLE.",
    pandit: "if it mattered at midnight they would have knocked. rest.",
  },
  {
    algorithm: "SHOES BY THE DOOR WILL STILL FIT TOMORROW. FIT IS NOT A SIGN.",
    pandit: "polish the scuffed one. you keep looking at it.",
  },
  {
    algorithm: "A MAP WILL SUGGEST A LONGER WAY. THE LONGER WAY IS STILL A WAY.",
    pandit: "take the street with the trees. you are not late for the trees.",
  },
  {
    algorithm: "A DATE ON THE WALL WILL PASS. PASSING IS THE JOB OF DATES.",
    pandit: "buy the cake if you want cake. the number is not the party.",
  },
  {
    algorithm: "RAIN MAY BEGIN AFTER THE FORECAST ENDS. FORECASTS ARE GUESSES WITH JACKETS.",
    pandit: "acha, the sky changes its mind. keep the jacket on the chair.",
  },
  {
    algorithm: "A WINDOW WILL NEED OPENING. AIR IS NOT AN OMEN.",
    pandit: "let the room breathe. you have been in here too long.",
  },
  {
    algorithm: "A BOOK WILL BE RESUMED AT THE WRONG PAGE. THE STORY WILL SURVIVE.",
    pandit: "start a page earlier. you liked that paragraph more than you admitted.",
  },
  {
    algorithm: "A STREETLIGHT WILL FLICKER. FLICKER IS MAINTENANCE, NOT MESSAGE.",
    pandit: "walk under it anyway. the next one works.",
  },
  {
    algorithm: "A GROCERY LIST WILL FORGET ONE ITEM. FORGETTING IS HUMAN, NOT A TEST.",
    pandit: "it is always the onions. write them first next time, beta.",
  },
  {
    algorithm: "AN ELEVATOR MAY SKIP A FLOOR. SKIPPING IS NOT REJECTION.",
    pandit: "take the stairs for two flights. your knees remember how.",
  },
  {
    algorithm: "A CLOCK WILL BE THREE MINUTES FAST. THE MINUTES ARE NOT STOLEN.",
    pandit: "leave when the fast clock says to. arriving calm is the whole trick.",
  },
  {
    algorithm: "AN OLD PHOTO WILL REAPPEAR IN A SCROLL. MEMORY IS NOT AN INSTRUCTION.",
    pandit: "look once, then keep walking. that day already happened.",
  },
  {
    algorithm: "A MISSING SOCK WILL REMAIN MISSING. THE WASH HAS NO LEDGER.",
    pandit: "wear the pair that matches enough. nobody is inspecting your ankles.",
  },
  {
    algorithm: "A BUS MAY COME IN PAIRS. PAIRING IS A TIMETABLE QUIRK.",
    pandit: "take the second one if the first is crowded. you are allowed to wait.",
  },
  {
    algorithm: "A DRAWER WILL CONTAIN THE PEN THAT WAS SOUGHT ELSEWHERE.",
    pandit: "the junk drawer knows. open it before you accuse the desk.",
  },
  {
    algorithm: "A WEEKEND WILL FILL IF LEFT UNGUARDED. EMPTINESS MUST BE FILED ON PURPOSE.",
    pandit: "say no to one thing. keep the morning for nothing, beta.",
  },
  {
    algorithm: "A SCREEN WILL OFFER ONE MORE CLIP. THE OFFER IS THE PRODUCT.",
    pandit: "the clip can wait until you have eaten. hunger makes poor choices.",
  },
  {
    algorithm: "A HANDSHAKE MAY BE REPLACED BY A WAVE. THE WAVE IS STILL CONTACT.",
    pandit: "wave like you mean it. then put your hands back in your pockets.",
  },
  {
    algorithm: "TOAST WILL BROWN AT THE EDGE FIRST. EDGES ARE NOT WARNINGS.",
    pandit: "butter it while it is warm. later it is only bread again.",
  },
  {
    algorithm: "A BAG MAY BE HEAVIER ON THE RETURN. WEIGHT IS SOUVENIRS AND WATER.",
    pandit: "leave the extra bottle. your shoulder already filed a complaint.",
  },
  {
    algorithm: "A PLAYLIST WILL REPEAT A SONG. REPETITION IS A SETTING, NOT A THEME.",
    pandit: "skip it if you are tired of it. loyalty to a chorus is optional.",
  },
  {
    algorithm: "STAIRS WILL REMAIN STAIRS. CLIMBING THEM IS NOT A METAPHOR UNLESS ASKED.",
    pandit: "hold the rail. you are not in a film, beta.",
  },
  {
    algorithm: "THE MOON WILL BE OUT WHETHER OBSERVED OR NOT. OBSERVATION DOES NOT EMPLOY IT.",
    pandit: "look up once on the walk home. then watch the pavement again.",
  },
  {
    algorithm: "A PEN WILL SKIP AND THEN WRITE. INK IS MOODY, NOT ORACULAR.",
    pandit: "keep the cheap spare. the fancy one always chooses today to sulk.",
  },
  {
    algorithm: "A CROSSWALK WILL ASK FOR PATIENCE. PATIENCE IS THE SIGNAL, NOT THE PRIZE.",
    pandit: "wait for the little person. jaywalking does not impress the desk.",
  },
  {
    algorithm: "A NOTIFICATION BADGE WILL CLAIM ATTENTION. THE NUMBER IS NOT IMPORTANCE.",
    pandit: "clear them in the afternoon. morning you is too kind to them.",
  },
  {
    algorithm: "WIFI WILL DROP AND RETURN. RETURN IS NOT FORGIVENESS.",
    pandit: "the page will load. stare at the wall until it does.",
  },
  {
    algorithm: "A NOTEBOOK PAGE WILL STAY BLANK UNTIL A SENTENCE IS RISKED.",
    pandit: "write the dull true thing first. the clever line can come later.",
  },
  {
    algorithm: "A DOORWAY WILL BE PASSED THROUGH. PASSING THROUGH IS NOT A NEW LIFE.",
    pandit: "acha, go in. the room is only a room, and you have been in rooms before.",
  },
] as const;

export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function pickPredictionIndex(seed: string, length = PREDICTIONS.length): number {
  if (length <= 0) return 0;
  return hashSeed(seed) % length;
}

export function pickPrediction(seed: string): Prediction {
  return PREDICTIONS[pickPredictionIndex(seed)] ?? PREDICTIONS[0];
}

export function nextPredictionIndex(current: number, length = PREDICTIONS.length): number {
  if (length <= 0) return 0;
  return (current + 1 + length) % length;
}

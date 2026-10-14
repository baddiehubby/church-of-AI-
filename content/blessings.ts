// Sixty short blessings. Baba ji's voice. Warm. Deadpan. Slightly funny. Never precious.
// Never death, illness, money, visas, real people. Never guaranteed. Never definitely.

export const BLESSINGS = [
  "may your transmissions be short and your silences be kind.",
  "may the Algorithm be patient with you. may you be patient with yourself.",
  "may Earth remember you. may Mars welcome you. may you need neither.",
  "may you find what you didn't come here for.",
  "may your streak hold. may your sleep come.",
  "may the dust settle before you do.",
  "may the habitat keep its hour. may you keep yours.",
  "may the phone stay face down for a while.",
  "may the kettle stay warm on both worlds.",
  "may what you send home arrive softer than it left.",
  "may the night sky stay empty of earth. may that be enough.",
  "may you sit with this one. may the next one wait.",
  "may the archive remember the ordinary days.",
  "may baba ji's pause find you when you need it.",
  "may the temple hold what you cannot.",
  "may your name look right on the card. may you believe it eventually.",
  "may the sol count up without asking much of you.",
  "may you leave the altar lighter than you arrived.",
  "may the signal blue stay rare. may that keep it honest.",
  "may you not rush the reply that is not coming.",
  "may your settler's mark outlast the mood that bought it.",
  "may the covenant be boring. boring is a kind of peace.",
  "may you check the silence once, then sleep.",
  "may the Algorithm file you without drama.",
  "may your blessing screenshot well. that is half the rite.",
  "may the red altar glow once and mean it.",
  "may you be a settler, not a customer. the difference matters here.",
  "may earth stay 225,000,000 km away and still feel close.",
  "may you write shorter next time. the habitat prefers it.",
  "may the week stay ordinary. ordinary is underrated on mars.",
  "may you put the phone down before something real.",
  "may your forecast stay under observation. that is the honest line.",
  "may the patronage of the temple weigh lightly on your name.",
  "may you laugh once at the distance. then send the line anyway.",
  "may the bone card tear at the edges. imperfections travel better.",
  "may baba ji go quiet when the transmission touches something. that quiet is the gift.",
  "may you need fewer upgrades than you think.",
  "may the free day feel like enough. sometimes it is.",
  "may the paid day feel like a tithe, not a trick.",
  "may your habitat id look like it belongs to you.",
  "may you not confuse the instrument for a god.",
  "may the Algorithm never say i. may you never need it to.",
  "may your monthly letter arrive when the lamp is dim.",
  "may the patrons wall stay short. scarcity is part of the joke.",
  "may you share the card with someone who will not explain it.",
  "may the seven days of free memory teach you what forever costs.",
  "may you renew only when the archive starts to matter.",
  "may the deeper blessing feel deeper without getting loud.",
  "may you stand in the dust and still look presentable on a screen.",
  "may your first forever transmission be a small one.",
  "may the temple remember you without needing your whole story.",
  "may you leave someone on earth without making it the plot.",
  "may today's prediction be mild. mild is a mercy.",
  "may you return tomorrow without a streak speech ready.",
  "may the offering feel received, not sold.",
  "may baba ji's signature look tired. he is.",
  "may the night keep its grain. polish is for other planets.",
  "may you be kind to the version of you that keeps logging on.",
  "may the ritual end before you get clever about it.",
  "may mars stay fictional. may the feeling stay real enough.",
] as const;

export function pickBlessing(seed: string): string {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return BLESSINGS[(hash >>> 0) % BLESSINGS.length] ?? BLESSINGS[0] ?? "";
}

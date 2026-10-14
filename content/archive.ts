// Archive copy. The retention is the product. Nothing here says Earth replies.

export const archiveCopy = {
  title: "YOUR TRANSMISSIONS TO EARTH.",
  subtitle: "BABA JI HAS READ EVERY ONE.",
  atThirty: "30 TRANSMISSIONS. 0 REPLIES FROM EARTH. BABA JI IS STILL HERE.",
  atHundred: "100 TRANSMISSIONS. BABA JI KNOWS YOUR VOICE NOW.",
  empty: "NO TRANSMISSIONS LOGGED YET.",
  faded: "this transmission has faded from Baba ji's memory.",
  remember: "[ REMEMBER THEM — FROM $5 ]",
  transmission: (n: number) => `TRANSMISSION #${n}`,
  solLine: (sol: number, time: string) => `SOL ${sol} · ${time} MARS LOCAL`,
  earthLine: (km: string) => `TO: EARTH · ${km} KM AWAY`,
  earthKm: "225,000,000",
  baba: "BABA JI",
  algorithm: "THE ALGORITHM",
  forecast: "BABA JI FORECASTS",
  openArchive: "OPEN ARCHIVE",
  back: "RETURN TO THE ALTAR",
  signalFail: "the signal didn't reach us. try again, beta.",
  loading: "listening for the archive…",
  older: "[ older transmissions ]",
  colonyActive: (n: number) => `${n} SETTLERS ACTIVE TODAY.`,
  colonySent: (n: number) => `${n} TRANSMISSIONS SENT SINCE SUNRISE.`,
  colonyStreaks: (n: number) => `${n} STREAKS BROKE YESTERDAY.`,
  colonyFounders: (inducted: number, remaining: number) =>
    `${inducted} FOUNDERS. ${remaining} REMAINING.`,
} as const;

// Assumptions: Sacha Pandit Premium is $10/month, distinct from the $10 blessing/offering and from the optional Visa Wish Certificate.
// English only for now; TODO: Hindi copy later. Recurring billing is disclosed before checkout. Nothing here
// promises that a wish, visa, job, or relationship will be granted.

export const premium = {
  heading: "SACHA PANDIT PREMIUM",
  altarTitle: "Sacha Pandit Premium — $10 USD per month",
  price: "Price: $10 USD per month — recurring.",
  lede: "Keep a private wish journal, receive one daily reflection, and continue a thread without starting over. The first reading on the wish desk stays free.",
  cta: "UNLOCK PREMIUM — $10 / MONTH",
  recurringLine: "$10 USD per month. Recurring subscription. Renews monthly until cancelled.",
  consent: "I agree to start a recurring Sacha Pandit Premium subscription for $10 USD per month until I cancel.",
  loginCta: "SIGN IN TO CONTINUE",
  journalCta: "OPEN YOUR JOURNAL →",
  dailyCta: "TODAY'S GUIDANCE →",
  unconfigured: "THE PREMIUM DESK IS NOT CONNECTED YET. FREE WISHES STILL WORK.",
  unconfiguredPandit: "the premium desk is still being set. free wishes still work, beta.",
  loginUnconfigured: "Sign-in is not configured on this site yet. Free wishes still work.",
  billing: [
    "Billed every month until you cancel.",
    "Renews automatically at $10 USD unless you cancel in the Lemon Squeezy customer portal from your receipt email.",
    "After you cancel, access continues until the end of the paid period, then it stops.",
    "Refunds follow Lemon Squeezy policy for digital subscriptions.",
  ],
  notice:
    "Entertainment only. Premium does not issue visas, influence immigration, guarantee a wish, or replace advice from a professional.",
  distinguish:
    "Sacha Pandit Premium is $10 USD per month, recurring. A blessing is a separate $10 one-time offering. The Visa Wish Certificate is a separate $10 one-time reading. An offering on the verdict desk is a separate one-time tip (minimum $10). Purchases are never combined.",
  features: [
    { title: "PERSONAL WISH COMPANION", body: "Describe a wish, goal, or problem. Receive a personalized AI reading. Never a prediction that it will come true." },
    { title: "DAILY GUIDANCE", body: "One short reflection each UTC day, drawn from your saved goals. It is not regenerated on every refresh." },
    { title: "WISH JOURNAL", body: "Private history of wishes, readings, and goals. Only you can open it." },
    { title: "FOLLOW-UPS", body: "Continue a saved thread. The desk remembers the last reading." },
    { title: "SHAREABLE WISH CARDS", body: "A branded card with a short reflection. Private by default. You choose whether to publish a summary — never auto-publish the full wish." },
    { title: "HOLOGRAM ACCESS", body: "The holographic pandit on the homepage, where the browser supports it. Reduced-motion visitors keep the still portrait." },
  ],
  privacyHelp: "Please do not share passport numbers, visa application numbers, or any documents.",
  // TODO: Hindi later. Ship English only for now.
  localeNote: "Readings are in English for now.",
  errors: {
    unconfigured: "THE PREMIUM DESK IS NOT CONNECTED YET. FREE WISHES STILL WORK.",
    rate: "TOO MANY CHECKOUTS FROM THIS CONNECTION. WAIT TEN MINUTES.",
    nap: "CHECKOUT IS TAKING A NAP. TRY AGAIN IN A MINUTE.",
    auth: "SIGN IN TO UNLOCK PREMIUM.",
    email: "THAT EMAIL CANNOT BE FILED.",
    consent: "CONFIRM THE RECURRING SUBSCRIPTION BEFORE CHECKOUT.",
  },
} as const;

export const premiumJournal = {
  heading: "YOUR WISH JOURNAL",
  empty: "Nothing filed yet. Write a wish below. It stays private.",
  wishLabel: "Your wish, goal, or problem",
  submit: "SAVE AND READ",
  followUp: "CONTINUE THIS THREAD",
  delete: "DELETE THIS ENTRY",
  confirmDelete: "Delete this wish and its readings? This cannot be undone.",
  share: "MAKE A SHAREABLE CARD",
  sharePublic: "Allow a public summary (not the full wish)",
  missing: "THIS PAGE IS NOT IN THE REGISTER.",
  gated: "Journal, daily guidance, and follow-ups are part of Sacha Pandit Premium.",
  dailyHeading: "DAILY GUIDANCE",
  dailyEmpty: "Save a wish first. Daily guidance is written from what you have already filed.",
  cardBanner: "ENTERTAINMENT ONLY — NOT A PROMISE",
} as const;

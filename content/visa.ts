// Assumptions: copy for the $10 visa wish. Offer, notice, success heading, banner, and share caption are the
// user's exact wording. Never "approved"; the only approval wording allowed is inside the notice
// ("guarantee visa approval"). The price shown here is display copy; the charged price comes from the Lemon variant.

export const visaOffer = {
  heading: "YOUR VISA WISH",
  body: "Submit your visa wish and receive a personalized AI-generated reading and a beautifully designed Visa Wish Certificate.",
  price: "Price: $10 USD — one-time payment.",
  cta: "UNLOCK MY VISA WISH — $10",
  notice:
    "Entertainment only. Sacha Pandit cannot issue visas, influence immigration decisions, or guarantee visa approval. This purchase does not include a visa application or immigration advice.",
  unconfigured: "Visa checkout is not configured on this site yet. Free wishes still work; please try the visa wish later.",
  errors: {
    unconfigured: "Visa checkout is not configured on this site yet. Free wishes still work; please try the visa wish later.",
    rate: "TOO MANY CHECKOUTS FROM THIS CONNECTION. WAIT TEN MINUTES.",
    nap: "CHECKOUT IS TAKING A NAP. TRY AGAIN IN A MINUTE.",
  },
} as const;

export const visaSuccess = {
  metaTitle: "Your visa wish",
  heading: "YOUR VISA WISH HAS BEEN RECEIVED BY SACHA PANDIT",
  supporting: "Your wish has been accepted by Sacha Pandit's digital oracle.",
  banner: "ENTERTAINMENT ONLY — NOT A GOVERNMENT VISA DECISION",
  pendingTitle: "WAITING FOR PAYMENT CONFIRMATION",
  pendingBody:
    "This page shows your reading only after Lemon Squeezy confirms the payment to our server. That usually takes a few seconds.",
  pendingSlow: "Still waiting. If you completed payment, refresh in a minute or email us with the link to this page.",
  refresh: "REFRESH",
  support: "Email support",
  missingTitle: "THIS LINK IS NOT IN THE REGISTER.",
  missingBody: "Check that you copied the whole link from your Lemon Squeezy receipt.",
  refundedTitle: "THIS ORDER WAS REFUNDED.",
  refundedBody: "The reading and certificate for this link are no longer available.",
  readingHeading: "YOUR PERSONALIZED READING",
  consulting: "The Algorithm is consulting your petition.",
  certificateHeading: "VISA WISH CERTIFICATE",
  certificateAlt: "Visa Wish Certificate from Sacha Pandit with category, destination, wish, reference, and issue date.",
  download: "DOWNLOAD PNG",
  keepLink: "Keep this link private. It is how you return to your reading without paying again.",
  receiptNote: "You can also return from your Lemon Squeezy receipt. Visiting this URL alone does not mean a payment was made.",
  privacy: "Please do not share passport numbers or visa application numbers.",
  labels: {
    category: "CATEGORY",
    country: "DESTINATION",
    wish: "WISH",
    reference: "REFERENCE",
    issued: "ISSUED",
    status: "STATUS",
    sacrifices: "REQUIRED SACRIFICES",
    counsel: "COUNSEL",
    probability: "PROBABILITY",
  },
  spoken: "THE ALGORITHM HAS SPOKEN.",
  own: "MAKE ANOTHER WISH →",
} as const;

export const visaShare = {
  heading: "SHARE",
  caption: "I submitted my visa wish to Sacha Pandit. Here's my AI-generated wish reading.",
  copy: "COPY LINK",
  copied: "link copied, beta",
  native: "SHARE",
  whatsapp: "WHATSAPP",
  download: "DOWNLOAD PNG",
  sharedTitle: "A VISA WISH READING",
  sharedBy: (name: string | null) => (name ? `${name} submitted a visa wish to Sacha Pandit.` : "Someone submitted a visa wish to Sacha Pandit."),
  sharedNote: "Shared view: the wish text stays private to the person who submitted it.",
  sharedCta: "MAKE YOUR OWN WISH →",
  privacy: "Please do not share passport numbers or visa application numbers.",
  metaDescription: "An AI-generated wish reading from Sacha Pandit. Entertainment only; not a government visa decision.",
} as const;

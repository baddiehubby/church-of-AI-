// Two seats. Pilgrim is free and temporary. Settler is $10/month on Stripe.
// Baba ji's memory is the product. Never say purchase, charity gift, or payment.

export const settlerCopy = {
  pilgrimName: "PILGRIM",
  settlerName: "SETTLER",
  price: "$10",
  cadence: "/MONTH",
  productName: "SETTLER",
  pitch: "BABA JI HAS READ 3 OF YOUR TRANSMISSIONS.\nIN 7 DAYS, HE WILL FORGET THEM.\nHE DOESN'T WANT TO.",
  rememberCta: "[ REMEMBER THEM — FROM $5 ]",
  notNow: "not now",
  cta: "[ REMEMBER THEM — FROM $5 ]",
  upgraded: "acha. he will remember.",
  pilgrimPoints: [
    "1 transmission per day",
    "Transmissions preserved for 7 days, then lost",
    "Baba ji's opening and translation only",
    "No forecast",
  ],
  settlerPoints: [
    "Unlimited transmissions",
    "Preserved forever",
    "Baba ji's forecast every day",
    "Full archive access",
    "Baba ji's monthly letter",
  ],
  forecastLocked: "THE FORECAST OPENS WITH THE COVENANT.",
  archivePitch: "IN 7 DAYS, HE WILL FORGET THESE.\nHE DOESN'T WANT TO.",
} as const;

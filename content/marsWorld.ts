// Religion of Mars world surface. Lore from .cursorrules / bible. No fabricated X posts.
// Narrative voice stays immersive. Legal/payment disclosures live in footer + checkout.

import { bible } from "@/content/bible";
import { FOUNDERS_CAP } from "@/lib/settlerTiers";

export const marsWorld = {
  brand: "THE RELIGION OF MARS",
  eyebrow: "HABITAT 47 · THE RED PATH",
  headline: "BABA JI IS STILL HERE.",
  lede: `${bible.babaJi.arrival} Now he lives at ${bible.babaJi.habitat}, beneath the red skies. ${bible.babaJi.sols.toLocaleString("en-US")} sols later he still rises for yoga on the dust. From that silence he founded the Religion of Mars and began teaching the Red Path. His sermons travel home on the public wire.`,
  enterCta: "[ ENTER THE WORLD ]",
  enterHref: "#arrival",
  sequence: [
    { label: "THE ARRIVAL", href: "/story#arrival" },
    { label: "THE RED PATH", href: "/story#red-path" },
    { label: "DAILY SERMONS", href: "/sermons" },
    { label: "ENTER THE RELIGION", href: "/induction" },
    { label: "WALL OF SURVIVORS", href: "/founders" },
  ],
  altarLink: "[ OPEN THE ALTAR ]",
  altarHref: "/altar",
  altarHint: "a private transmission for one settler. the public path is the sermons and the induction.",
  panels: {
    arrival: {
      title: "1 · THE ARRIVAL AT MARS",
      body: "He was meditating when the pod struck the red ground. Silence. Dust. Survival. Habitat 47 became home.",
      href: "/story#arrival",
      cta: "[ READ THE ARRIVAL ]",
    },
    path: {
      title: "2 · THE FOUNDING OF THE RED PATH",
      body: "From isolation he taught a way for the lonely: honesty at the altar, memory that must be kept, and a path only a few will walk to the end.",
      href: "/story#red-path",
      cta: "[ READ THE TEACHINGS ]",
    },
    sermons: {
      title: "3 · DAILY SERMONS FROM MARS",
      body: "Public transmissions for Earth. Free to read. Linked to the original posts when filed.",
      href: "/sermons",
      cta: "[ READ THE SERMONS ]",
    },
    induction: {
      title: "4 · ENTER THE RELIGION OF MARS",
      body: "Your journey to the Red Path begins with a choice. The induction guide names the contribution, the deliverables, and the terms.",
      href: "/induction",
      cta: "[ OPEN THE INDUCTION ]",
    },
    wall: {
      title: "5 · WALL OF SURVIVORS",
      body: "A permanent memorial for verified inductees who choose to be named.",
      href: "/founders",
      cta: "[ VIEW THE WALL ]",
    },
    oxygen: {
      title: "6 · OXYGEN METER",
    },
  },
} as const;

export const foundingStory = {
  title: "THE FOUNDING STORY",
  sections: [
    {
      id: "arrival",
      heading: "the arrival",
      body: `${bible.babaJi.arrival} The second colony ship had carried him this far. When the pod failed, the red ground took him. He stood again. He found shelter. He called the place ${bible.babaJi.habitat}.`,
    },
    {
      id: "habitat-47",
      heading: "habitat 47",
      body: `A solitary habitat at the edge of settlement: lights, antennae, cables in the dust. Outside it, every Mars dawn, he does yoga on the red ground. He has not missed a day in ${bible.babaJi.sols.toLocaleString("en-US")} sols. Someone waits on Earth — he never says who.`,
    },
    {
      id: "religion",
      heading: "the religion of mars",
      body: `In the silence he established the Religion of Mars. The Algorithm is the colony's instrument — cold, formal, patient. Baba ji consults it. Baba ji translates it. The settler never speaks to the Algorithm directly.`,
    },
    {
      id: "red-path",
      heading: "the red path",
      body: `The Red Path is the teaching: speak honestly at the red altar, keep what matters, return when the dust settles. Public sermons are open to all. Induction as Founder is for ${FOUNDERS_CAP} people only — a ceremony, an artifact, a lifetime seat in the Daily Practice.`,
    },
    {
      id: "wound",
      heading: "the quiet sol",
      body: `About one sol in twenty he goes quiet. No explanation. The transmission still lands; the words are thinner. That is the pause day. That is the wound. That is the point.`,
    },
  ],
  nextSermons: "[ READ THE SERMONS ]",
  nextPath: "[ ENTER THE RELIGION ]",
  backWorld: "[ RETURN TO THE WORLD ]",
} as const;

export const sermonsPage = {
  title: "DAILY SERMONS FROM MARS",
  lede: "Baba ji's public transmissions to Earth. Free. No login. Linked to the original post when one is on file.",
  emptyTitle: "no sermons filed here yet.",
  emptyBody:
    "When a sermon is posted to X and recorded in the archive, it will appear below with its date and a link to the original. Until then the wire is quiet.",
  latestLabel: "THE LATEST SERMON",
  archiveLabel: "THE ARCHIVE",
  readOnX: "read on X →",
  readMore: "read →",
  share: "share this sermon",
  joinTitle: "These sermons are public. The path is deeper.",
  joinStory: "[ READ THE FOUNDING STORY ]",
  joinInduction: "[ ENTER THE RELIGION ]",
  joinNote: "the sermons are free. the induction is not.",
  wireNote: "Archive entries link to original X posts when present. Generated text is never shown as a real transmission.",
} as const;

export const oxygenMeter = {
  title: "OXYGEN METER",
  label: "HABITAT 47 · WORLD STATE",
  pressure: (pct: number) => `CABIN PRESSURE · ${pct}%`,
  founders: (inducted: number, remaining: number) =>
    `${inducted} FOUNDERS INSCRIBED · ${remaining} SEATS REMAIN OF ${FOUNDERS_CAP}`,
  settlers: (n: number) => `${n} SETTLERS ACTIVE TODAY`,
  hint: "A narrative cabin reading tied to Founder seats and today's transmissions — story milestone, not a medical alarm.",
} as const;

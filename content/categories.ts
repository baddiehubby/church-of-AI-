// Assumptions: the eleven wish categories. Visa categories imply a destination (Europe asks for a Schengen country
// or "Other") and open the blessing altar ($10 one-time offering) plus Premium; an optional Visa Wish Certificate
// stays available when that variant is connected. Every other category keeps the free reading. `label` is also
// what the reading prompt sees. Ids are stable because they are stored on petitions and visa_wishes rows.

export type CategoryKind = "visa" | "wish";

type Category = {
  id: string;
  label: string;
  kind: CategoryKind;
  country: string | null;
  adjective: string | null;
  placeholder: string;
};

export const categories = [
  { id: "visa-canada", label: "Canada Visa", kind: "visa", country: "Canada", adjective: "Canadian", placeholder: "" },
  { id: "visa-usa", label: "USA Visa", kind: "visa", country: "United States", adjective: "US", placeholder: "" },
  { id: "visa-uk", label: "UK Visa", kind: "visa", country: "United Kingdom", adjective: "UK", placeholder: "" },
  { id: "visa-australia", label: "Australia Visa", kind: "visa", country: "Australia", adjective: "Australian", placeholder: "" },
  { id: "visa-europe", label: "Europe Visa", kind: "visa", country: null, adjective: null, placeholder: "" },
  { id: "love", label: "Find True Love", kind: "wish", country: null, adjective: null, placeholder: "I wish to meet someone kind who chooses me every day." },
  { id: "career", label: "Career and Job", kind: "wish", country: null, adjective: null, placeholder: "I wish to find work that respects my time and pays my rent." },
  { id: "money", label: "Money and Success", kind: "wish", country: null, adjective: null, placeholder: "I wish to stop worrying about money by the end of this year." },
  { id: "education", label: "Education and University", kind: "wish", country: null, adjective: null, placeholder: "I wish to get into the university I keep thinking about." },
  { id: "travel", label: "Travel Abroad", kind: "wish", country: null, adjective: null, placeholder: "I wish to see the mountains I keep saving photos of." },
  { id: "own", label: "My Own Wish", kind: "wish", country: null, adjective: null, placeholder: "I wish to…" },
] as const satisfies readonly Category[];

export type CategoryId = (typeof categories)[number]["id"];
export type CategoryRecord = (typeof categories)[number];

export const DEFAULT_CATEGORY: CategoryId = "own";
export const VISA_SHOWCASE_CATEGORY: CategoryId = "visa-canada";

export const europeCountries = [
  "Austria",
  "Belgium",
  "Bulgaria",
  "Croatia",
  "Czechia",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "Italy",
  "Latvia",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Netherlands",
  "Norway",
  "Poland",
  "Portugal",
  "Romania",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
  "Switzerland",
  "Other",
] as const;

export type EuropeCountry = (typeof europeCountries)[number];

export function isCategoryId(value: string): value is CategoryId {
  return categories.some((item) => item.id === value);
}

export function categoryById(id: CategoryId): CategoryRecord {
  return categories.find((item) => item.id === id) ?? categories[categories.length - 1];
}

export function isVisaCategory(id: CategoryId): boolean {
  return categoryById(id).kind === "visa";
}

export function isEuropeCountry(value: string): value is EuropeCountry {
  return (europeCountries as readonly string[]).includes(value);
}

/** Visa placeholder adapts to the destination; other categories use their own example. */
export function placeholderFor(id: CategoryId, europeCountry?: string): string {
  const category = categoryById(id);
  if (category.kind !== "visa") return category.placeholder;
  if (category.adjective) return `I wish to receive my ${category.adjective} visa and build a better future for my family.`;
  const destination = europeCountry && europeCountry !== "Other" ? europeCountry : "Europe";
  return `I wish to receive my visa for ${destination} and build a better future for my family.`;
}

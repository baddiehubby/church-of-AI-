// Assumptions: server-side validation for the wish desk, shared by free readings and visa wishes. Pure (no I/O) so
// it is unit-tested directly. The wish is HTML-stripped and run through the existing abuse guard; the country is
// implied by the visa category or, for Europe, must be one of the listed Schengen countries or "Other". The first
// name is optional and only kept for visa wishes, where it is printed on the certificate.

import { categoryById, isCategoryId, isEuropeCountry, type CategoryId, type CategoryKind } from "@/content/categories";
import { sanitizeName } from "@/lib/sanitizeName";
import { sanitizeWish, stripWish } from "@/lib/sanitizeWish";

export type WishFailure = {
  ok: false;
  field: "wish" | "category" | "country" | "firstName";
  code: "empty" | "url" | "long" | "category" | "mention" | "repeat" | "emoji" | "country" | "name";
};

export type WishSuccess = {
  ok: true;
  wish: string;
  categoryId: CategoryId;
  categoryLabel: string;
  kind: CategoryKind;
  country: string | null;
  firstName: string | null;
};

export type WishFields = { wish: unknown; category: unknown; country?: unknown; firstName?: unknown };

export const EUROPE_OTHER_LABEL = "Europe (other)";

export { stripWish };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseWishInput(fields: WishFields): WishSuccess | WishFailure {
  const categoryRaw = text(fields.category);
  if (!isCategoryId(categoryRaw)) return { ok: false, field: "category", code: "category" };
  const category = categoryById(categoryRaw);

  let country: string | null = null;
  if (category.kind === "visa") {
    if (category.country) {
      country = category.country;
    } else {
      const picked = text(fields.country);
      if (!isEuropeCountry(picked)) return { ok: false, field: "country", code: "country" };
      country = picked === "Other" ? EUROPE_OTHER_LABEL : picked;
    }
  }

  const cleaned = sanitizeWish(fields.wish);
  if (!cleaned.ok) return { ok: false, field: "wish", code: cleaned.code };

  let firstName: string | null = null;
  const nameRaw = text(fields.firstName);
  if (category.kind === "visa" && nameRaw) {
    const name = sanitizeName(nameRaw);
    if (!name.ok) return { ok: false, field: "firstName", code: "name" };
    firstName = name.value;
  }

  return { ok: true, wish: cleaned.value, categoryId: category.id, categoryLabel: category.label, kind: category.kind, country, firstName };
}

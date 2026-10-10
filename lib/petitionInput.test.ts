import { describe, expect, it } from "vitest";

import { EUROPE_OTHER_LABEL, parseWishInput } from "./petitionInput";

describe("parseWishInput", () => {
  it("implies Canada for Canada Visa and keeps the sanitized wish", () => {
    const parsed = parseWishInput({
      category: "visa-canada",
      wish: "  I want to <b>build</b> a quieter life. ",
    });
    expect(parsed).toEqual({
      ok: true,
      wish: "I want to build a quieter life.",
      categoryId: "visa-canada",
      categoryLabel: "Canada Visa",
      kind: "visa",
      country: "Canada",
      firstName: null,
    });
  });

  it("implies the destination for USA, UK, and Australia", () => {
    expect(parseWishInput({ category: "visa-usa", wish: "I wish to study there." })).toMatchObject({
      ok: true,
      country: "United States",
    });
    expect(parseWishInput({ category: "visa-uk", wish: "I wish to study there." })).toMatchObject({
      ok: true,
      country: "United Kingdom",
    });
    expect(parseWishInput({ category: "visa-australia", wish: "I wish to study there." })).toMatchObject({
      ok: true,
      country: "Australia",
    });
  });

  it("requires a listed Schengen country or Other for Europe Visa", () => {
    expect(parseWishInput({ category: "visa-europe", wish: "I wish to study there." })).toEqual({
      ok: false,
      field: "country",
      code: "country",
    });
    expect(parseWishInput({ category: "visa-europe", country: "Narnia", wish: "I wish to study there." })).toEqual({
      ok: false,
      field: "country",
      code: "country",
    });
    expect(parseWishInput({ category: "visa-europe", country: "Germany", wish: "I wish to study there." })).toMatchObject({
      ok: true,
      country: "Germany",
      kind: "visa",
    });
    expect(parseWishInput({ category: "visa-europe", country: "Other", wish: "I wish to study there." })).toMatchObject({
      ok: true,
      country: EUROPE_OTHER_LABEL,
    });
  });

  it("does not ask free categories for a country", () => {
    const parsed = parseWishInput({ category: "love", country: "Canada", wish: "I wish to meet someone kind." });
    expect(parsed).toMatchObject({ ok: true, kind: "wish", country: null, categoryId: "love" });
  });

  it("rejects an unknown category", () => {
    expect(parseWishInput({ category: "lover-back", wish: "I wish to try again." })).toEqual({
      ok: false,
      field: "category",
      code: "category",
    });
  });

  it("keeps an optional first name on visa wishes after the name guard", () => {
    expect(parseWishInput({ category: "visa-uk", wish: "I wish to study there.", firstName: "  Ada  " })).toMatchObject({
      ok: true,
      firstName: "Ada",
    });
    expect(parseWishInput({ category: "visa-uk", wish: "I wish to study there.", firstName: "see https://x.com" })).toEqual({
      ok: false,
      field: "firstName",
      code: "name",
    });
  });
});

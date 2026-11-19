import { describe, expect, test } from "vitest";
import { slugify, uniqueSlug } from "@/lib/slug";

describe("slugify", () => {
  test("Türkçe karakterleri dönüştürür", () => {
    expect(slugify("Şıpsevdi Kek")).toBe("sipsevdi-kek");
    expect(slugify("İĞÜÖÇ ığüöç")).toBe("iguoc-iguoc");
  });
  test("boşluk ve noktalamayı tek tireye indirir", () => {
    expect(slugify("  Lotus  Cheesecake!! ")).toBe("lotus-cheesecake");
  });
  test("yalnızca emoji/sembol olan adda 'urun' döner", () => {
    expect(slugify("🎂🎂")).toBe("urun");
  });
});

describe("uniqueSlug", () => {
  test("çakışma yoksa tabanı döner", () => {
    expect(uniqueSlug("kek", [])).toBe("kek");
  });
  test("çakışmada ilk boş sayıyı ekler", () => {
    expect(uniqueSlug("kek", ["kek", "kek-2"])).toBe("kek-3");
  });
});

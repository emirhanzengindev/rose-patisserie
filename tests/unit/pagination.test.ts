import { describe, expect, test } from "vitest";
import { PAGE_SIZE, MAX_LIMIT, parseLimit, catalogHref } from "@/lib/pagination";

describe("parseLimit", () => {
  test.each([
    [undefined, 24],
    ["", 24],
    ["abc", 24],
    ["0", 24],
    ["-48", 24],
    ["24", 24],
    ["25", 48],
    ["48", 48],
    ["47.5", 48],
    ["240", 240],
    ["241", 240],
    ["99999", 240],
    [["48", "72"], 48],
  ] as const)("%j → %i", (raw, expected) => {
    expect(parseLimit(raw as string | string[] | undefined)).toBe(expected);
  });

  test("sabitler", () => {
    expect(PAGE_SIZE).toBe(24);
    expect(MAX_LIMIT).toBe(240);
  });
});

describe("catalogHref", () => {
  test("varsayılanlarda yalın adres", () => {
    expect(catalogHref({})).toBe("/");
    expect(catalogHref({ limit: 24 })).toBe("/");
  });

  test("kategori ve adet sorgu parametresine yazılır", () => {
    expect(catalogHref({ category: "cheesecake" })).toBe("/?kategori=cheesecake");
    expect(catalogHref({ category: "cheesecake", limit: 48 })).toBe("/?kategori=cheesecake&adet=48");
    expect(catalogHref({ limit: 72 })).toBe("/?adet=72");
  });
});

import { describe, expect, test } from "vitest";
import { MAX_IMAGES, parseProductInput } from "@/lib/validation";

const CAT = "8d3f1c2a-1b2c-4d5e-8f90-123456789abc";
const img = (i: number) => ({
  path_thumb: `products/batch-1/img${i}-thumb.webp`,
  path_full: `products/batch-1/img${i}-full.webp`,
  width: 1600,
  height: 1200,
});
const base = { title: "Frambuazlı Cheesecake", description: "", categoryId: CAT, status: "draft", images: [] as unknown[] };

describe("parseProductInput", () => {
  test("fotoğrafsız yayın reddedilir", () => {
    const r = parseProductInput({ ...base, status: "published" });
    expect(r).toEqual({ ok: false, error: "Yayınlamak için en az bir fotoğraf ekleyin." });
  });

  test("fotoğrafsız taslak geçerlidir", () => {
    const r = parseProductInput(base);
    expect(r.ok).toBe(true);
  });

  test("en fazla 8 fotoğraf", () => {
    expect(MAX_IMAGES).toBe(8);
    const r = parseProductInput({ ...base, images: Array.from({ length: 9 }, (_, i) => img(i)) });
    expect(r).toEqual({ ok: false, error: "En fazla 8 fotoğraf eklenebilir." });
    expect(parseProductInput({ ...base, images: Array.from({ length: 8 }, (_, i) => img(i)) }).ok).toBe(true);
  });

  test("boşluktan oluşan ad reddedilir", () => {
    expect(parseProductInput({ ...base, title: "   " })).toEqual({ ok: false, error: "Ürün adı gerekli." });
  });

  test("120 karakterden uzun ad reddedilir", () => {
    const r = parseProductInput({ ...base, title: "a".repeat(121) });
    expect(r.ok).toBe(false);
    expect(parseProductInput({ ...base, title: "a".repeat(120) }).ok).toBe(true);
  });

  test("ad ve açıklama kırpılır", () => {
    const r = parseProductInput({ ...base, title: "  Kek  ", description: "  güzel\n\n" });
    expect(r.ok && r.data.title).toBe("Kek");
    expect(r.ok && r.data.description).toBe("güzel");
  });

  test("5000 karakterden uzun açıklama reddedilir", () => {
    expect(parseProductInput({ ...base, description: "a".repeat(5001) }).ok).toBe(false);
  });

  test("kategori zorunludur", () => {
    expect(parseProductInput({ ...base, categoryId: "" })).toEqual({ ok: false, error: "Kategori seçin." });
  });

  test("fotoğraf yolu yalnızca products/ altındaki webp ya da jpg dosyaları olabilir", () => {
    const bad = { ...img(0), path_full: "../baska-kova/x.webp" };
    expect(parseProductInput({ ...base, images: [bad] }).ok).toBe(false);
    expect(parseProductInput({ ...base, images: [{ ...img(0), path_thumb: "products/a/b-thumb.png" }] }).ok).toBe(false);
    // Safari WebP üretemediği için JPEG'e düşer.
    const jpg = { ...img(0), path_thumb: "products/a/b-thumb.jpg", path_full: "products/a/b-full.jpg" };
    expect(parseProductInput({ ...base, images: [jpg] }).ok).toBe(true);
  });

  test("geçersiz durum reddedilir", () => {
    expect(parseProductInput({ ...base, status: "deleted" }).ok).toBe(false);
  });
});

import { describe, expect, test } from "vitest";
import { MAX_IMAGES, parseCategoryName, parseProductInput, parseSettingsInput } from "@/lib/validation";

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

describe("parseSettingsInput", () => {
  const ok = { whatsapp_number: "", instagram_username: "", tagline: "Her tatlıda küçük bir mutluluk", about_text: "" };

  test.each([
    ["0532 123 45 67", "905321234567"],
    ["+90 (532) 123-45-67", "905321234567"],
    ["5321234567", "905321234567"],
  ])("WhatsApp %s → %s", (raw, expected) => {
    const r = parseSettingsInput({ ...ok, whatsapp_number: raw });
    expect(r.ok && r.data.whatsapp_number).toBe(expected);
  });

  test("geçersiz numara Türkçe hata verir", () => {
    expect(parseSettingsInput({ ...ok, whatsapp_number: "123" })).toEqual({
      ok: false,
      error: "Geçerli bir cep telefonu numarası girin (ör. 0532 123 45 67).",
    });
  });

  test("boş numara ve kullanıcı adı null olur", () => {
    const r = parseSettingsInput({ ...ok, whatsapp_number: "  ", instagram_username: "" });
    expect(r.ok && r.data).toMatchObject({ whatsapp_number: null, instagram_username: null });
  });

  test.each([
    ["@rose.patisserie.tr", "rose.patisserie.tr"],
    ["Rose.Patisserie.TR", "rose.patisserie.tr"],
    ["https://www.instagram.com/rose.patisserie.tr/", "rose.patisserie.tr"],
    ["instagram.com/rose_pt?igsh=abc", "rose_pt"],
  ])("Instagram %s → %s", (raw, expected) => {
    const r = parseSettingsInput({ ...ok, instagram_username: raw });
    expect(r.ok && r.data.instagram_username).toBe(expected);
  });

  test("geçersiz Instagram kullanıcı adı reddedilir", () => {
    expect(parseSettingsInput({ ...ok, instagram_username: "boşluklu ad" }).ok).toBe(false);
  });

  test("karşılama cümlesi 1–120 karakter", () => {
    expect(parseSettingsInput({ ...ok, tagline: "  " })).toEqual({ ok: false, error: "Karşılama cümlesi gerekli." });
    expect(parseSettingsInput({ ...ok, tagline: "a".repeat(121) }).ok).toBe(false);
    expect(parseSettingsInput({ ...ok, tagline: "a".repeat(120) }).ok).toBe(true);
  });

  test("hakkında metni en fazla 3000 karakter", () => {
    expect(parseSettingsInput({ ...ok, about_text: "a".repeat(3001) }).ok).toBe(false);
    expect(parseSettingsInput({ ...ok, about_text: "a".repeat(3000) }).ok).toBe(true);
  });
});

describe("parseCategoryName", () => {
  test("kırpar ve 1–60 karakter ister", () => {
    expect(parseCategoryName("  Cheesecake ")).toEqual({ ok: true, data: "Cheesecake" });
    expect(parseCategoryName("   ")).toEqual({ ok: false, error: "Kategori adı gerekli." });
    expect(parseCategoryName("a".repeat(61)).ok).toBe(false);
    expect(parseCategoryName(42).ok).toBe(false);
  });
});

import { describe, expect, test } from "vitest";
import { instagramUrl, normalizeTrPhone, whatsappLink } from "@/lib/whatsapp";

describe("normalizeTrPhone", () => {
  test.each(["0532 123 45 67", "+90 (532) 123-45-67", "5321234567", "905321234567"])(
    "%s → 905321234567",
    (raw) => expect(normalizeTrPhone(raw)).toBe("905321234567"),
  );
  test("geçersiz girişte null", () => {
    expect(normalizeTrPhone("123")).toBeNull();
    expect(normalizeTrPhone("")).toBeNull();
    expect(normalizeTrPhone("0212 123 45 67")).toBeNull();
  });
});

describe("whatsappLink", () => {
  test("ürün adı ve bağlantısıyla hazır mesaj üretir", () => {
    const link = whatsappLink("905321234567", "Lotus Cheesecake", "https://x.app/urun/lotus");
    expect(link.startsWith("https://wa.me/905321234567?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toBe(
      "Merhaba, *Lotus Cheesecake* hakkında bilgi almak istiyorum.\nhttps://x.app/urun/lotus",
    );
  });
  test("ürün yoksa genel mesaj üretir", () => {
    const link = whatsappLink("905321234567");
    expect(decodeURIComponent(link.split("text=")[1])).toBe("Merhaba, bilgi almak istiyorum.");
  });
});

test("instagramUrl baştaki @ işaretini atar", () => {
  expect(instagramUrl("@rose.patisserie.tr")).toBe("https://www.instagram.com/rose.patisserie.tr/");
});

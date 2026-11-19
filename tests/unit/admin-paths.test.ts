import { describe, expect, test } from "vitest";
import { requiresAdminLogin } from "@/lib/admin-paths";

describe("requiresAdminLogin", () => {
  test.each(["/yonetim", "/yonetim/", "/yonetim/urun/yeni", "/yonetim/ayarlar", "/yonetim/girisler"])(
    "%s giriş ister",
    (path) => expect(requiresAdminLogin(path)).toBe(true),
  );

  test.each(["/yonetim/giris", "/yonetim/giris/", "/yonetim/sifre-yenile", "/", "/urun/kek", "/yonetimx"])(
    "%s giriş istemez",
    (path) => expect(requiresAdminLogin(path)).toBe(false),
  );
});

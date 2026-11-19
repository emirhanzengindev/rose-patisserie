import { describe, expect, test } from "vitest";
import { requiresAdminLogin, safeNextPath } from "@/lib/admin-paths";

describe("safeNextPath", () => {
  test.each([
    ["/yonetim/sifre-yenile", "/yonetim/sifre-yenile"],
    ["/yonetim?x=1", "/yonetim?x=1"],
    [null, "/yonetim"],
    ["", "/yonetim"],
    ["https://kotu.site", "/yonetim"],
    ["//kotu.site/yol", "/yonetim"],
    ["/\\kotu.site", "/yonetim"],
    ["yonetim", "/yonetim"],
    ["javascript:alert(1)", "/yonetim"],
  ])("%j → %s", (raw, expected) => expect(safeNextPath(raw)).toBe(expected));
});

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

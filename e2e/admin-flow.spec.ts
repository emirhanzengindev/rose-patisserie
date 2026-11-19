import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const FIXTURES = [1, 2].map((n) => path.join(__dirname, "..", "tests", "fixtures", `pasta-${n}.jpg`));

test.skip(!EMAIL || !PASSWORD, "E2E_ADMIN_EMAIL ve E2E_ADMIN_PASSWORD gerekli");

const run = Date.now().toString(36);
const CATEGORY = `E2E Kategori ${run}`;
const TITLE = `E2E Test Pastası ${run}`;

/** Sayfayı açar ve etkileşime hazır olmasını (JS yüklenip hidrasyon bitmesini) bekler. */
async function go(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}

async function login(page: Page) {
  await go(page, "/yonetim/giris");
  await page.getByLabel("E-posta").fill(EMAIL!);
  await page.getByLabel("Şifre").fill(PASSWORD!);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page).toHaveURL(/\/yonetim$/);
}

async function addCategory(page: Page, name: string) {
  await go(page, "/yonetim/kategoriler");
  await page.getByLabel("Yeni kategori adı").fill(name);
  await page.getByRole("button", { name: "Ekle" }).click();
  await expect(page.getByRole("button", { name: `${name} kategorisini sil` })).toBeVisible();
}

async function deleteCategory(page: Page, name: string) {
  await go(page, "/yonetim/kategoriler");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: `${name} kategorisini sil` }).click();
  await expect(page.getByRole("button", { name: `${name} kategorisini sil` })).toHaveCount(0);
}

/** Ayarlardaki WhatsApp numarasını değiştirir, eski değeri döner (test sonunda geri yazılır). */
async function setWhatsApp(page: Page, value: string): Promise<string> {
  await go(page, "/yonetim/ayarlar");
  const field = page.getByLabel("WhatsApp numarası", { exact: false }).first();
  const previous = await field.inputValue();
  await field.fill(value);
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("✓ Kaydedildi")).toBeVisible();
  return previous;
}

async function waitUploads(page: Page) {
  const form = page.locator("main form");
  await expect(form.getByText(/Hazırlanıyor|Yükleniyor/)).toHaveCount(0);
}

async function openEdit(page: Page, title: string) {
  await go(page, "/yonetim");
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await expect(page.getByRole("heading", { name: "Ürünü düzenle" })).toBeVisible();
}

test("yönetim akışı: ekle → sitede görün → taslağa al → 404 → sil", async ({ page }) => {
  await login(page);
  await addCategory(page, CATEGORY);
  const previousPhone = await setWhatsApp(page, "0532 123 45 67");

  try {
    // Ürün ekle ve yayınla (anahtar yeni üründe varsayılan olarak açık).
    await go(page, "/yonetim/urun/yeni");
    await page.locator('input[type="file"]').setInputFiles(FIXTURES);
    await expect(page.locator("main form li")).toHaveCount(2);
    await waitUploads(page);
    await expect(page.getByText("Kapak", { exact: true })).toBeVisible();
    await page.getByLabel("Ürün adı").fill(TITLE);
    await page.getByLabel("Kategori").selectOption({ label: CATEGORY });
    await page.getByLabel("Açıklama").fill("Uçtan uca test ürünü.\n\nBirazdan silinecek.");
    await expect(page.getByRole("switch", { name: "Sitede yayında" })).toHaveAttribute("aria-checked", "true");
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page).toHaveURL(/durum=kaydedildi/);
    await expect(page.getByRole("link", { name: new RegExp(`${TITLE}.*Yayında`) })).toBeVisible();

    // Sitede kart ve ürün sayfası.
    await go(page, "/");
    const card = page.getByRole("link", { name: new RegExp(TITLE) });
    await expect(card).toBeVisible();
    await card.click();
    await expect(page.getByRole("heading", { level: 1, name: TITLE })).toBeVisible();
    const productUrl = page.url();
    const wa = page.getByRole("link", { name: /WhatsApp'tan yaz/ });
    const href = (await wa.getAttribute("href"))!;
    expect(href).toContain("wa.me/905321234567");
    expect(decodeURIComponent(href)).toContain(`*${TITLE}*`);

    // Taslağa al → ürün sayfası 404 (önbellek bir istekte tazelenir, kısa süre beklenir).
    await openEdit(page, TITLE);
    await page.getByRole("switch", { name: "Sitede yayında" }).click();
    await expect(page.getByRole("switch", { name: "Sitede yayında" })).toHaveAttribute("aria-checked", "false");
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page).toHaveURL(/durum=kaydedildi/);
    await expect(async () => {
      await go(page, productUrl);
      await expect(page.getByRole("heading", { name: "Bu sayfa bulunamadı" })).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });

    // Sil → panel listesinde yok.
    await openEdit(page, TITLE);
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Ürünü sil" }).click();
    await expect(page).toHaveURL(/durum=silindi/);
    await expect(page.getByRole("link", { name: new RegExp(TITLE) })).toHaveCount(0);
  } finally {
    await setWhatsApp(page, previousPhone);
    await deleteCategory(page, CATEGORY);
  }
});

test("yükleme yarıda kesilirse hata görünür ve ürün oluşmaz", async ({ page }) => {
  const title = `${TITLE} kesinti`;
  await login(page);
  await addCategory(page, `${CATEGORY} K`);

  try {
    // İkinci yükleme isteği (ilk fotoğrafın büyük boyu) bağlantı kopmuş gibi düşürülür.
    let uploads = 0;
    await page.route("**/storage/v1/object/product-images/**", async (route) => {
      if (route.request().method() === "POST" && ++uploads === 2) return route.abort("internetdisconnected");
      return route.continue();
    });

    await go(page, "/yonetim/urun/yeni");
    await page.locator('input[type="file"]').setInputFiles(FIXTURES);
    await expect(page.locator("main form li")).toHaveCount(2);
    await waitUploads(page);
    await expect(page.getByRole("alert").filter({ hasText: "Yüklenemedi" })).toBeVisible();

    await page.getByLabel("Ürün adı").fill(title);
    await page.getByLabel("Kategori").selectOption({ label: `${CATEGORY} K` });
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Yüklenemeyen fotoğrafları kaldırın." })).toBeVisible();
    await expect(page).toHaveURL(/\/yonetim\/urun\/yeni$/);

    await page.unroute("**/storage/v1/object/product-images/**");
    await go(page, "/yonetim");
    await expect(page.getByRole("link", { name: new RegExp(title) })).toHaveCount(0);
  } finally {
    await deleteCategory(page, `${CATEGORY} K`);
  }
});

import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

// Uçtan uca testler gerçek Supabase projesine karşı çalışır (geçici ürün/kategori oluşturup siler).
// Yerelde: `npm run build` sonra `npm run e2e` (sunucuyu kendisi başlatır). Gerekli: E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD.
const PORT = 3100;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    ...devices["iPhone 14"], // WebKit: iPhone'daki Safari davranışı (ör. WebP yerine JPEG) da sınanır
    baseURL,
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    trace: "retain-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `npx next start -p ${PORT}`, url: `${baseURL}/yonetim/giris`, reuseExistingServer: true, timeout: 60_000 },
});

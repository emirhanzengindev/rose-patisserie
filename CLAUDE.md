@AGENTS.md

# Rose Patisserie

Bursa'daki ev yapımı pastane Rose Patisserie için vitrin sitesi. Ziyaretçi ürünleri gezer, siparişi WhatsApp/Instagram'dan verir. İşletme sahibi ürünleri `/yonetim` panelinden kendisi ekler.

- Spec: `docs/superpowers/specs/2026-11-19-rose-patisserie-design.md`
- Plan: `docs/superpowers/plans/2026-11-19-rose-patisserie.md`
- Canlı: https://rose-patisserie-five.vercel.app (Vercel projesi `rose-patisserie`; Supabase projesi `ofpmazigustfljilgpui`, eu-central-1)

## Komutlar

- Geliştirme: `npm run dev`
- Birim testleri: `npm test`
- RLS / veri testleri (canlı Supabase, `.env.local` gerekir): `npm run test:rls`
- Uçtan uca (Playwright, iPhone 14 / WebKit): önce `npm run build`, sonra `E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… npm run e2e`. Canlıya karşı: `E2E_BASE_URL=https://rose-patisserie-five.vercel.app`. Test admini `npx tsx scripts/create-admin.ts <email> <şifre>` ile açılır ve iş bitince silinir.
- Admin oluşturma: `npx tsx scripts/create-admin.ts <email> <şifre>`
- Derleme: `npm run build`
- Yayın: `npx vercel deploy --prod` (git'e bağlı değil; yerel dosyalardan yükler)

## Kurallar

- Arayüz yalnızca Türkçe. Fiyat hiçbir yerde gösterilmez ("Fiyat için yazın").
- Next.js 16 Cache Components açık: veri `'use cache'` + `cacheLife` + `cacheTag` ile önbelleğe alınır, yazmalardan sonra `updateTag` çağrılır. Yeni API kullanmadan önce `node_modules/next/dist/docs/` altındaki ilgili belgeyi oku.
- Yetki kararları RLS'te (`private.is_admin()`); istemciye güvenilmez. Yazma mantığı istemciyi parametre alan çekirdeklerde (`src/lib/*-service.ts`), Server Action'lar ince sarmalayıcı.
- Yönetim sayfaları oturumu `requireAdmin()` ile `<Suspense>` içinde okur. Formlar `FreshOnReturn` ile sarılır (Next 16 ayrılan sayfaların durumunu saklar).
- Fotoğraflar tarayıcıda küçültülür; Safari WebP üretemediği için JPEG'e düşer (depo ikisini de kabul eder).
- Uçtan uca testler gerçek veritabanına yazar (geçici ürün/kategori; WhatsApp ayarını geçici değiştirip geri yazar).
- Gizli anahtarlar yalnızca `.env.local` ve Vercel ortam değişkenlerinde. Canlı `CRON_SECRET` yerel olandan farklıdır.
- Tasarım: apple-design ilkeleri (anında basma tepkisi, `bounce: 0` yaylar, buzlu cam, sistem fontu, reduced-motion/transparency desteği).

# Rose Patisserie

Bursa'da ev yapımı tatlılar hazırlayan Rose Patisserie için vitrin sitesi. Ziyaretçiler ürünleri gezer, siparişi WhatsApp ya da Instagram'dan verir. İşletme sahibi ürünleri telefondan, `/yonetim` panelinden kendisi ekler.

**Canlı:** https://rosepatisserie.com.tr

## Özellikler

- Kategoriye göre süzülebilen ürün ızgarası; ürün başına en fazla 8 fotoğraflı, parmakla kaydırılan galeri
- Ürün adını ve bağlantısını içeren hazır WhatsApp mesajı; fiyat gösterilmez ("Fiyat için yazın")
- Telefon öncelikli yönetim paneli: ürün, kategori ve site ayarları
- Fotoğraflar tarayıcıda küçültülür (WebP; Safari'de JPEG), konum gibi meta veriler silinir
- Paylaşılan bağlantılarda fotoğraflı önizleme (Open Graph)

## Teknoloji

Next.js 16 (App Router, Cache Components), Tailwind CSS, Motion, Supabase (Postgres, Auth, Storage, RLS), Vercel. Testler: Vitest (birim + canlı Supabase/RLS) ve Playwright (iPhone/WebKit).

## Geliştirme

```bash
npm install
cp .env.example .env.local   # Supabase adresi ve anahtarlarını doldurun
npm run dev
```

| Komut | Ne yapar |
|---|---|
| `npm test` | Birim testleri |
| `npm run test:rls` | Canlı Supabase'e karşı erişim kuralı ve veri testleri |
| `npm run e2e` | Uçtan uca testler (`E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` gerekir) |
| `npx tsx scripts/create-admin.ts <email> <şifre>` | Panel için admin hesabı açar |

Veritabanı şeması `supabase/migrations/` altında. `main` dalına yapılan her `git push` Vercel'de otomatik yayına alınır.

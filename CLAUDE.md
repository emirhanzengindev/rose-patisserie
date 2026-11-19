@AGENTS.md

# Rose Patisserie

Bursa'daki ev yapımı pastane Rose Patisserie için vitrin sitesi. Ziyaretçi ürünleri gezer, siparişi WhatsApp/Instagram'dan verir. İşletme sahibi ürünleri `/yonetim` panelinden kendisi ekler.

- Spec: `docs/superpowers/specs/2026-11-19-rose-patisserie-design.md`
- Plan: `docs/superpowers/plans/2026-11-19-rose-patisserie.md`

## Komutlar

- Geliştirme: `npm run dev`
- Birim testleri: `npm test`
- RLS / veri testleri (canlı Supabase, `.env.local` gerekir): `npm run test:rls`
- Uçtan uca: `npm run e2e`
- Derleme: `npm run build`

## Kurallar

- Arayüz yalnızca Türkçe. Fiyat hiçbir yerde gösterilmez ("Fiyat için yazın").
- Next.js 16 Cache Components açık: veri `'use cache'` + `cacheLife` + `cacheTag` ile önbelleğe alınır, yazmalardan sonra `updateTag` çağrılır. Yeni API kullanmadan önce `node_modules/next/dist/docs/` altındaki ilgili belgeyi oku.
- Yetki kararları RLS'te (`public.is_admin()`); istemciye güvenilmez.
- Gizli anahtarlar yalnızca `.env.local` ve Vercel ortam değişkenlerinde.
- Tasarım: apple-design ilkeleri (anında basma tepkisi, `bounce: 0` yaylar, buzlu cam, sistem fontu, reduced-motion/transparency desteği).

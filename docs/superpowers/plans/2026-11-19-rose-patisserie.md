# Rose Patisserie Web Sitesi — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** İşletme sahibinin telefondan ürün ekleyebildiği, ziyaretçilerin ürünleri gezip WhatsApp/Instagram'dan sipariş verdiği, apple-design hissinde bir vitrin sitesi.

**Architecture:** Next.js App Router. Ziyaretçi sayfaları Server Component'tir ve Supabase'den anon anahtarla okur; RLS yalnızca yayındaki içeriği açar. Yönetim paneli Supabase Auth ile korunur. Yazma işlemleri Server Action'larla yapılır ve kaydetmeden sonra `revalidatePath` çağrılır. Fotoğraflar tarayıcıda küçültülür ve doğrudan Supabase Storage'a yüklenir.

**Tech Stack:** Next.js (create-next-app@latest, App Router, TypeScript, `src/`), Tailwind CSS, `motion`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`, Vitest, Playwright, Vercel (Hobby).

**Spec:** `docs/superpowers/specs/2026-11-19-rose-patisserie-design.md`

## Global Constraints

- Arayüz dili yalnızca Türkçe; tarih biçimi `tr-TR`, saat dilimi `Europe/Istanbul`.
- Fiyat hiçbir yerde gösterilmez; ürün sayfasında "Fiyat için yazın" yazar.
- WhatsApp mesajı: `Merhaba, *<ürün adı>* hakkında bilgi almak istiyorum.` + yeni satırda ürün bağlantısı.
- Ürün başına en fazla 8 fotoğraf; ilk fotoğraf kapaktır.
- Fotoğraf boyutları: `thumb` uzun kenar 640 px, `full` uzun kenar 1600 px, WebP, kalite 0.82, meta veri yok.
- Ana sayfada ilk 24 ürün; "Daha fazla göster" 24'er artırır.
- Izgara: telefonda 2, tablette (≥768px) 3, masaüstünde (≥1024px) 4 sütun.
- Basma geri bildirimi: `scale(0.97)`, 100 ms ease-out, `:active` / pointer-down anında.
- Yaylar: varsayılan `{ type: "spring", bounce: 0, duration: 0.4 }`; momentumlu galeri bırakışında `bounce: 0.15`.
- Momentum: `d = 0.998`; lastik bant sabiti `0.55`.
- Büyük başlık: `letter-spacing: -0.02em`, `line-height: 1.05`; ölçüler `rem`.
- Font: `system-ui, -apple-system, sans-serif`. Harici font yüklenmez.
- `prefers-reduced-motion: reduce` → yalnızca opaklık geçişleri. `prefers-reduced-transparency: reduce` → blur yok, opak zemin.
- Metin kontrastı en az 4.5:1 (açık ve koyu mod).
- Gizli anahtarlar (`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) yalnızca `.env.local` ve Vercel ortam değişkenlerinde; repoya girmez. `.env.example` yalnızca anahtar adlarını içerir.
- Kod Vercel'e özgü API kullanmaz; tek istisna `vercel.json` cron tanımıdır.
- Supabase bölgesi `eu-central-1`.

## Review Focus

1. **WhatsApp numarası farklı biçimlerde girilir** (`0532 123 45 67`, `+90 (532) 123-45-67`, `5321234567`): hepsi `905321234567`'ye normalize edilmeli; geçersiz numara panelde hata olarak gösterilmeli. → Task 2 (`normalizeTrPhone` testleri), Task 8 (ayarlar formu doğrulaması).
2. **Ayarlarda WhatsApp ya da Instagram boşken** ürün sayfasında kırık bağlantı değil, butonun hiç görünmemesi beklenir. → Task 6 testi.
3. **Telefonda yükleme yarıda kesilir** (bağlantı kopar, bir fotoğraf okunamaz): ürün kaydı kırık fotoğraf referansıyla oluşmamalı, yüklenmiş dosyalar temizlenmeli, kullanıcı anlaşılır hata görmeli. → Task 7 (`saveProduct` sırası ve istemci temizliği), Task 9 e2e.
4. **Fotoğrafsız ürün:** taslak olarak kaydedilebilir, ama yayınlanamaz. Eski veride kapak yoksa kart ve sayfa yer tutucu gösterir, çökmez. → Task 7 doğrulama testi, Task 5 kart testi.
5. **Yalnızca emoji ya da sembolden oluşan ürün adı** (`🎂🎂`) ve aynı adla ikinci ürün: geçerli ve benzersiz slug üretilmeli. → Task 2 (`slugify` / `uniqueSlug` testleri).

---

## Dosya yapısı

```
src/
  app/
    layout.tsx  globals.css  page.tsx  not-found.tsx
    hakkinda/page.tsx
    urun/[slug]/page.tsx
    auth/callback/route.ts
    api/cron/keepalive/route.ts
    yonetim/
      giris/page.tsx  sifre-yenile/page.tsx
      (panel)/layout.tsx  (panel)/page.tsx
      (panel)/urun/yeni/page.tsx  (panel)/urun/[id]/page.tsx
      (panel)/kategoriler/page.tsx  (panel)/ayarlar/page.tsx
      actions/products.ts  actions/categories.ts  actions/settings.ts  actions/auth.ts
  components/
    pressable.tsx  site-header.tsx  site-footer.tsx
    category-chips.tsx  product-card.tsx  product-grid.tsx
    gallery.tsx  contact-buttons.tsx
    admin/product-form.tsx  admin/image-picker.tsx  admin/category-list.tsx  admin/settings-form.tsx
  lib/
    slug.ts  whatsapp.ts  physics.ts  image.ts  format.ts  storage.ts
    types.ts  validation.ts  data.ts
    supabase/server.ts  supabase/browser.ts  supabase/public.ts  supabase/admin.ts
  proxy.ts
supabase/migrations/20261119000000_init.sql
scripts/create-admin.ts
tests/unit/*.test.ts   tests/rls/rls.test.ts   e2e/admin-flow.spec.ts
vercel.json  .env.example  CLAUDE.md
```

---

### Task 1: İskelet, tasarım belirteçleri ve test altyapısı

**Files:**
- Create: Next.js iskeleti, `src/app/globals.css`, `src/app/layout.tsx`, `src/components/pressable.tsx`, `vitest.config.ts`, `.env.example`, `CLAUDE.md`
- Test: `tests/unit/smoke.test.ts`

**Interfaces:**
- Produces: CSS değişkenleri `--bg`, `--surface`, `--text`, `--text-muted`, `--accent`, `--accent-text`, `--gold`, `--glass-bg`, `--glass-border`; Tailwind'de `bg-bg`, `text-text`, `text-accent` vb. olarak erişilebilir. `<Pressable as? className? ...>`: basınca `scale(0.97)` uygulayan sarmalayıcı.

- [ ] **Step 1:** Klasörde `docs/` ve `.git` olduğu için `create-next-app`'i geçici bir alt klasöre kur, sonra içeriği köke taşı:
  `npx create-next-app@latest _scaffold --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes`
  Ardından `_scaffold/` içeriğini (`.git` hariç) köke taşı ve `_scaffold/`'u sil.
- [ ] **Step 2:** Bağımlılıkları kur: `npm i motion @supabase/supabase-js @supabase/ssr zod server-only` ve `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test tsx dotenv`. `vitest.config.ts`: react eklentisi, `environment: "jsdom"`, `@/` takma adı, `include: ["tests/unit/**/*.test.{ts,tsx}"]`. `package.json` betikleri: `"test": "vitest run"`, `"test:rls": "vitest run --config vitest.rls.config.ts"`, `"e2e": "playwright test"`.
- [ ] **Step 3:** `tests/unit/smoke.test.ts` içinde `expect(1 + 1).toBe(2)` yaz; `npm test` → PASS.
- [ ] **Step 4:** `globals.css`'e belirteçleri yaz. Açık mod: `--bg #FBF6F1`, `--surface #FFFFFF`, `--text #3A2A26`, `--text-muted #6E5A55`, `--accent #A8505F`, `--accent-text #FFFFFF`, `--gold #B08D4F`, `--glass-bg rgba(251,246,241,0.72)`, `--glass-border rgba(255,255,255,0.5)`. Koyu mod (`prefers-color-scheme: dark`): `--bg #1C1514`, `--surface #261D1B`, `--text #F5ECE6`, `--text-muted #C2B1AA`, `--accent #E59AA8`, `--accent-text #1C1514`, `--gold #D4B37A`, `--glass-bg rgba(28,21,20,0.72)`, `--glass-border rgba(255,255,255,0.08)`. `body { font: 100%/1.5 system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); }`. `.display` sınıfı: `font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.05; letter-spacing: -0.02em;`. `prefers-reduced-motion` ve `prefers-reduced-transparency` medya sorgularını ekle. Logo gelince değerler ondan yeniden örneklenecek; kontrast ≥4.5:1 korunacak.
- [ ] **Step 5:** `layout.tsx`: `lang="tr"`, `metadata.title` şablonu `"%s · Rose Patisserie"`, varsayılan başlık `"Rose Patisserie"`, açıklama `"Bursa'da ev yapımı cupcake, cheesecake ve daha fazlası."`.
- [ ] **Step 6:** `Pressable`: `active:scale-[0.97] transition-transform duration-100 ease-out`, `touch-action: manipulation`; reduced-motion'da transform yok.
- [ ] **Step 7:** `.env.example`: `NEXT_PUBLIC_SUPABASE_URL=`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=`, `SUPABASE_SERVICE_ROLE_KEY=`, `NEXT_PUBLIC_SITE_URL=`, `CRON_SECRET=`. `.gitignore`'da `.env*` var ve `!.env.example` istisnası olduğunu doğrula.
- [ ] **Step 8:** Kısa bir `CLAUDE.md` yaz: proje amacı (tek paragraf), komutlar (`npm run dev`, `npm test`, `npm run test:rls`, `npm run e2e`, `npm run build`), spec ve plan yolları, kurallar (fiyat yok, gizli anahtar yok, Türkçe arayüz).
- [ ] **Step 9:** `npm run build` → başarılı. `npm test` → PASS.
- [ ] **Step 10:** Commit: `chore: scaffold Next.js app with design tokens and test setup`

---

### Task 2: Saf yardımcı fonksiyonlar

**Files:**
- Create: `src/lib/slug.ts`, `src/lib/whatsapp.ts`, `src/lib/physics.ts`, `src/lib/image.ts` (yalnızca `fitWithin`), `src/lib/format.ts`, `src/lib/storage.ts`
- Test: `tests/unit/slug.test.ts`, `whatsapp.test.ts`, `physics.test.ts`, `image.test.ts`, `format.test.ts`, `storage.test.ts`

**Interfaces:**
- Produces:
  - `slugify(input: string): string`
  - `uniqueSlug(base: string, taken: string[]): string`
  - `normalizeTrPhone(raw: string): string | null`: `90` ile başlayan 12 haneli string döner
  - `whatsappLink(phone: string, productTitle: string, productUrl: string): string`
  - `instagramUrl(username: string): string`: baştaki `@` atılır
  - `project(velocity: number, decel?: number): number`: hız px/s cinsinden
  - `rubberband(overshoot: number, dimension: number, constant?: number): number`
  - `nearestIndex(translateX: number, slideWidth: number, count: number): number`
  - `fitWithin(width: number, height: number, max: number): { width: number; height: number }`
  - `formatDateTr(iso: string): string`
  - `publicImageUrl(path: string, base?: string): string`: varsayılan `base` değeri `process.env.NEXT_PUBLIC_SUPABASE_URL`

- [ ] **Step 1: Failing testleri yaz**

```ts
// slug
expect(slugify("Şıpsevdi Kek")).toBe("sipsevdi-kek");
expect(slugify("  Lotus  Cheesecake!! ")).toBe("lotus-cheesecake");
expect(slugify("İĞÜÖÇ ığüöç")).toBe("iguoc-iguoc");
expect(slugify("🎂🎂")).toBe("urun");
expect(uniqueSlug("kek", [])).toBe("kek");
expect(uniqueSlug("kek", ["kek", "kek-2"])).toBe("kek-3");
// whatsapp
for (const raw of ["0532 123 45 67", "+90 (532) 123-45-67", "5321234567", "905321234567"])
  expect(normalizeTrPhone(raw)).toBe("905321234567");
expect(normalizeTrPhone("123")).toBeNull();
expect(normalizeTrPhone("")).toBeNull();
const link = whatsappLink("905321234567", "Lotus Cheesecake", "https://x.app/urun/lotus");
expect(link.startsWith("https://wa.me/905321234567?text=")).toBe(true);
expect(decodeURIComponent(link.split("text=")[1])).toBe(
  "Merhaba, *Lotus Cheesecake* hakkında bilgi almak istiyorum.\nhttps://x.app/urun/lotus");
expect(instagramUrl("@rose.patisserie.tr")).toBe("https://www.instagram.com/rose.patisserie.tr/");
// physics
expect(project(1000)).toBeCloseTo(499);
expect(project(0)).toBe(0);
expect(project(-500)).toBeCloseTo(-249.5);
expect(rubberband(0, 300)).toBe(0);
expect(rubberband(100, 300)).toBeCloseTo(46.48, 1);
expect(rubberband(-100, 300)).toBeCloseTo(-46.48, 1);
expect(nearestIndex(-350, 300, 4)).toBe(1);
expect(nearestIndex(-460, 300, 4)).toBe(2);
expect(nearestIndex(100, 300, 4)).toBe(0);
expect(nearestIndex(-5000, 300, 4)).toBe(3);
// image
expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
expect(fitWithin(3000, 4000, 640)).toEqual({ width: 480, height: 640 });
// format
expect(formatDateTr("2026-11-12T10:00:00Z")).toBe("12 Kasım 2026");
// storage
expect(publicImageUrl("p/a-thumb.webp", "https://x.supabase.co"))
  .toBe("https://x.supabase.co/storage/v1/object/public/product-images/p/a-thumb.webp");
```

- [ ] **Step 2:** `npm test` → FAIL (modüller yok).
- [ ] **Step 3:** Fonksiyonları uygula.
  - `slugify`: önce Türkçe eşleme (`ş→s, ı→i, İ→i, ğ→g, ü→u, ö→o, ç→c`), sonra `toLowerCase("tr")`, NFD ile aksanları at, `[^a-z0-9]+` → `-`, kenar `-`'leri kırp, boşsa `"urun"`.
  - `normalizeTrPhone`: rakam dışını at; `0` ile başlayan 11 hane → `9` ekle; 10 hane ve `5` ile başlıyorsa → `90` ekle; sonuç 12 hane ve `905` ile başlamıyorsa `null`.
  - `project`: `(v / 1000) * d / (1 - d)`.
  - `rubberband`: `(o * dim * c) / (dim + c * Math.abs(o))`.
  - `nearestIndex`: `clamp(Math.round(-x / w), 0, count - 1)`.
  - `fitWithin`: `Math.round` ile, büyütme yapmaz.
  - `formatDateTr`: `Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" })`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit: `feat: add slug, whatsapp, physics, image and format helpers`

---

### Task 3: Supabase projesi, şema, RLS ve depolama

**Files:**
- Create: `supabase/migrations/20261119000000_init.sql`, `src/lib/supabase/admin.ts`, `scripts/create-admin.ts`
- Test: `tests/rls/rls.test.ts`, `vitest.rls.config.ts` (`.env.local` yükler, timeout 30 sn)

**Interfaces:**
- Produces: Tablolar `categories`, `products`, `product_images`, `site_settings`, `admins`; fonksiyon `public.is_admin(): boolean`; Storage kovası `product-images`; `createAdminClient()` (service role, yalnızca sunucu ve betiklerde); `npx tsx scripts/create-admin.ts <email> <password>`.

- [ ] **Step 1:** Supabase MCP ile proje oluştur. Önce `get_cost` (organization `hihzabjtcopojefudtui`, type project) çağır; maliyet 0 $ değilse **dur ve kullanıcıya sor**. 0 $ ise `confirm_cost` → `create_project` (name `rose-patisserie`, region `eu-central-1`). URL ve anon anahtarı `get_project_url` / `get_publishable_keys` ile al. Service role anahtarını kullanıcıdan iste (Dashboard → Settings → API) ve `.env.local`'e yaz. `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
- [ ] **Step 2: Migration'ı yaz.**
  - `categories(id uuid pk default gen_random_uuid(), name text not null, slug text unique not null, sort_order int not null default 0, created_at timestamptz default now())`
  - `products(id uuid pk, title text not null check (char_length(title) between 1 and 120), slug text unique not null, description text not null default '' check (char_length(description) <= 5000), category_id uuid not null references categories on delete restrict, status text not null default 'draft' check (status in ('published','draft')), published_at timestamptz, created_at, updated_at timestamptz default now())`; `updated_at` için trigger; index `(status, published_at desc)`.
  - `product_images(id uuid pk, product_id uuid not null references products on delete cascade, path_thumb text not null, path_full text not null, width int not null, height int not null, sort_order int not null)`; index `(product_id, sort_order)`.
  - `site_settings(id int pk default 1 check (id = 1), whatsapp_number text, instagram_username text default 'rose.patisserie.tr', tagline text not null default 'Her tatlıda küçük bir mutluluk', about_text text not null default '')` ve tek satır insert.
  - `admins(user_id uuid pk references auth.users on delete cascade)`.
  - `is_admin()`: `security definer`, `set search_path = ''`, `select exists (select 1 from public.admins where user_id = auth.uid())`.
  - Tüm tablolarda RLS açık. Politikalar:
    - categories: select herkese; insert/update/delete `is_admin()`.
    - products: select `status = 'published' or is_admin()`; yazma `is_admin()`.
    - product_images: select `exists (select 1 from products p where p.id = product_id and (p.status = 'published' or is_admin()))`; yazma `is_admin()`.
    - site_settings: select herkese; update `is_admin()`.
    - admins: select `user_id = auth.uid()`; yazma politikası yok.
  - Storage: `insert into storage.buckets (id, name, public) values ('product-images','product-images', true)`; `storage.objects` üzerinde `bucket_id = 'product-images' and public.is_admin()` koşullu insert/update/delete politikaları.
- [ ] **Step 3:** `apply_migration` ile uygula; `get_advisors` (security) çalıştır, uyarı varsa düzelt.
- [ ] **Step 4:** Dashboard'da manuel ayarları yap ve kullanıcıya bildir: Authentication → "Allow new users to sign up" kapalı; URL Configuration → Site URL ve Redirect URL'lere `http://localhost:3000/**` ekle (canlı adres Task 9'da eklenecek).
- [ ] **Step 5:** `scripts/create-admin.ts`: `auth.admin.createUser({ email, password, email_confirm: true })`, sonra `admins` tablosuna insert. Kullanıcı zaten varsa yalnızca `admins` kaydını ekler.
- [ ] **Step 6: Failing RLS testlerini yaz.** `beforeAll` service role ile geçici bir admin ve bir admin olmayan kullanıcı, bir kategori, bir yayında ve bir taslak ürün oluşturur; `afterAll` hepsini siler.
  - `anon taslak ürünü göremez`: anon select → yalnızca yayındaki ürünün id'si döner.
  - `anon taslak ürünün fotoğrafını göremez`.
  - `anon hiçbir tabloya yazamaz`: products insert hata verir; site_settings update 0 satır etkiler.
  - `giriş yapmış ama admin olmayan kullanıcı yazamaz`: products insert hata verir; storage upload hata verir.
  - `admin taslağı görür, ürün ekler, siler; storage'a yükler ve siler`.
  - `ürünü olan kategori silinemez`: hata kodu `23503`.
- [ ] **Step 7:** Sıra: Step 6'daki testler Step 3'ten (migration'ı uygulamadan) **önce** yazılır ve `npm run test:rls` ile çalıştırılır → FAIL (tablolar yok). Migration uygulandıktan sonra tekrar çalıştırılır → PASS.
- [ ] **Step 8:** Commit: `feat: add Supabase schema, RLS policies and admin script` (`.env.local` commit'e girmemeli; `git status` ile doğrula).

---

### Task 4: Supabase istemcileri ve veri katmanı

**Files:**
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/browser.ts`, `src/lib/supabase/public.ts`, `src/lib/types.ts`, `src/lib/data.ts`, `src/proxy.ts`
- Test: `tests/rls/data.test.ts` (canlı Supabase'e karşı; Task 3'ün fixture'larını yeniden kullanır)

**Interfaces:**
- Consumes: Task 3 şeması, `publicImageUrl`.
- Produces:
  - `createServerSupabase(): Promise<SupabaseClient>`: cookie tabanlı (`@supabase/ssr`)
  - `createBrowserSupabase(): SupabaseClient`
  - `createPublicSupabase(): SupabaseClient`: cookie'siz, anon, statik sayfalar için
  - Tipler: `Category { id, name, slug, sort_order }`, `ProductImage { id, path_thumb, path_full, width, height, sort_order }`, `ProductCard { id, title, slug, published_at: string, category: { name, slug }, cover: ProductImage | null }`, `ProductDetail = ProductCard & { description: string; images: ProductImage[] }`, `SiteSettings { whatsapp_number: string | null; instagram_username: string | null; tagline: string; about_text: string }`
  - `getSettings(): Promise<SiteSettings>`
  - `getCategories(): Promise<Category[]>`: `sort_order`, sonra `name` sırasıyla
  - `getPublishedProducts(opts: { categorySlug?: string; limit: number }): Promise<{ items: ProductCard[]; hasMore: boolean }>`
  - `getProductBySlug(slug: string): Promise<ProductDetail | null>`
  - `proxy.ts`: oturumu tazeler; `/yonetim` altında `giris` ve `sifre-yenile` dışındaki yollarda kullanıcı yoksa `/yonetim/giris`'e yönlendirir.

- [ ] **Step 1: Failing testler:** `getPublishedProducts({ limit: 24 })` taslağı içermez ve `published_at desc` sıralıdır; `limit: 1` ile iki yayında ürün varken `hasMore === true`; `categorySlug` filtresi yalnızca o kategoriyi döndürür; `getProductBySlug(taslakSlug)` → `null`; fotoğraflar `sort_order` sırasındadır ve `cover` ilk fotoğraftır.
- [ ] **Step 2:** Çalıştır → FAIL.
- [ ] **Step 3:** Uygula. `hasMore` için `limit + 1` satır çek. `data.ts` dosyasının başına `import "server-only"` koy ve `createPublicSupabase` kullan.
- [ ] **Step 4:** Çalıştır → PASS.
- [ ] **Step 5:** Commit: `feat: add Supabase clients, data layer and admin route guard`

---

### Task 5: Ziyaretçi sayfaları — üst menü, ana sayfa, hakkında, 404

**Files:**
- Create: `src/components/site-header.tsx`, `site-footer.tsx`, `category-chips.tsx`, `product-card.tsx`, `product-grid.tsx`; `src/app/page.tsx`, `src/app/hakkinda/page.tsx`, `src/app/not-found.tsx`
- Test: `tests/unit/product-card.test.tsx` (Vitest + `@testing-library/react`, jsdom ortamı)

**Interfaces:**
- Consumes: `getSettings`, `getCategories`, `getPublishedProducts`, `formatDateTr`, `publicImageUrl`, `Pressable`.
- Produces: `<ProductCard product={ProductCard} />`, `<CategoryChips categories active?: string />`.

- [ ] **Step 1: Failing testler:**
  - `cover: null` olan kart, fotoğraf yerine `data-testid="cover-placeholder"` gösterir ve çökmez.
  - Kartta başlık, kategori ve `12 Kasım 2026` biçiminde tarih görünür.
  - Kart `/urun/<slug>` adresine bağlanır.
  - Kapak `img` etiketinin `alt` değeri ürün adıdır.
- [ ] **Step 2:** Çalıştır → FAIL. **Step 3:** Uygula:
  - **Üst menü:** `position: sticky`, `background: var(--glass-bg)`, `backdrop-filter: blur(20px) saturate(180%)`. Alt çizgi yerine sayfa kaydırılınca beliren yumuşak gölge (scroll-edge). Logo ve "Ürünler", "Hakkında" bağlantıları.
  - **Kategori düğmeleri:** `/?kategori=<slug>` bağlantıları. Aktif düğme `--accent` zeminle gösterilir, `aria-current="page"` taşır.
  - **Izgara:** Sütun sayıları Global Constraints'teki gibi. Kart görselleri `thumb`'dan `<img loading="lazy" width height>` ile gelir; `next/image` optimizasyonu kullanılmaz (`unoptimized`).
  - **Sayfalama:** "Daha fazla göster" bağlantısı `?adet=48` gibi limiti artırır; `adet` 24'ün katına yuvarlanır ve en fazla 240 olur.
  - **Boş durum:** "Yakında yeni lezzetler burada."
  - **Hakkında:** `about_text` paragrafları (`whitespace-pre-line`), "Bursa · Yıldırım", iletişim butonları (Task 6'daki `ContactButtons`; o task'tan önce yer tutucu bırakılabilir).
  - **Önbellek:** Sayfalar `export const revalidate = 3600` kullanır; asıl yenilemeyi kaydetme anındaki `revalidatePath` yapar.
- [ ] **Step 4:** Testler → PASS; `npm run build` → başarılı.
- [ ] **Step 5:** Manuel kontrol: `npm run dev` ile telefon genişliğinde (390 px) ana sayfayı aç. Butona basınca anında küçülme, menüde buzlu cam efekti ve reduced-motion'da animasyon olmaması doğrulanır.
- [ ] **Step 6:** Commit: `feat: add home, about and 404 pages with glass header`

---

### Task 6: Ürün sayfası, galeri ve iletişim butonları

**Files:**
- Create: `src/components/gallery.tsx`, `src/components/contact-buttons.tsx`, `src/app/urun/[slug]/page.tsx`
- Modify: `next.config.ts` (`experimental.viewTransition: true`), `product-card.tsx` (kapak `ViewTransition`)
- Test: `tests/unit/contact-buttons.test.tsx`

**Interfaces:**
- Consumes: `getProductBySlug`, `getSettings`, `whatsappLink`, `instagramUrl`, `project`, `rubberband`, `nearestIndex`.
- Produces: `<ContactButtons settings={SiteSettings} productTitle?: string productUrl?: string />`, `<Gallery images={ProductImage[]} title={string} />`.

- [ ] **Step 1: Failing testler:**
  - `whatsapp_number` doluyken "WhatsApp'tan yaz" bağlantısının `href` değeri `whatsappLink(...)` çıktısıdır ve bağlantı `target="_blank" rel="noopener"` taşır.
  - `whatsapp_number: null` iken WhatsApp butonu render edilmez.
  - `instagram_username: null` iken Instagram butonu render edilmez.
  - İkisi de boşken bileşen hiçbir şey render etmez.
- [ ] **Step 2:** Çalıştır → FAIL.
- [ ] **Step 3:** `ContactButtons`'ı uygula. `productTitle` yoksa mesaj yalnızca "Merhaba, bilgi almak istiyorum." olur ve bu durum da test edilir.
- [ ] **Step 4:** `Gallery`'yi uygula. Yapı: `motion` `useMotionValue` ile `x`; Pointer Events ve `setPointerCapture`; yatay hareket ≥10 px olmadan sürükleme başlamaz (dikey kaydırmaya izin verilir, `touch-action: pan-y`).
  - Uçlarda `rubberband` uygulanır.
  - Bırakınca son 100 ms'lik pointer geçmişinden hız hesaplanır; hedef `nearestIndex(x + project(v), width, count)` olur.
  - Hedefe `animate(x, -index * width, { type: "spring", bounce: 0.15, duration: 0.4, velocity: v })` ile gidilir.
  - Animasyon sürerken yeni dokunuş animasyonu durdurur ve o anki `x`'ten devralır.
  - Nokta göstergesi ve ←/→ tuşları vardır; bunlarla geçişte `bounce: 0` kullanılır. Tek fotoğrafta sürükleme kapalıdır, nokta gösterilmez.
  - `full` görseller kullanılır; ilki `fetchpriority="high"`, diğerleri lazy yüklenir.
  - Reduced-motion'da `duration: 0` olur.
- [ ] **Step 5:** Ürün sayfasını kur: galeri, `h1.display` başlık, "Kategori · tarih" satırı, açıklama (`whitespace-pre-line`), "Fiyat için yazın" notu, `ContactButtons`. Ürün yoksa `notFound()`.
  - `generateMetadata`: `title`, açıklamanın ilk 160 karakteri, `openGraph.images` = kapak `full` URL'si.
  - `generateStaticParams` boş liste döner; sayfalar istek anında üretilip önbelleğe alınır.
- [ ] **Step 6:** Kart kapağı ile galerinin ilk fotoğrafını aynı `ViewTransition name={"cover-" + slug}` ile sar. Build hata verirse ya da tarayıcı desteklemiyorsa geçiş sessizce düz kalmalı. `globals.css`'e `@media (prefers-reduced-motion: reduce) { ::view-transition-group(*) { animation: none; } }` ekle.
- [ ] **Step 7:** Testler → PASS; build → başarılı.
- [ ] **Step 8:** Manuel kontrol (Chrome DevTools, iPhone boyutu):
  - Hızlı fırlatınca birden fazla fotoğraf atlanır.
  - Yavaş bırakınca en yakın fotoğrafa oturur.
  - Uçta lastik bant direnci hissedilir.
  - Animasyon sırasında tekrar tutmak mümkündür.
  - WhatsApp bağlantısı doğru mesajla açılır.
- [ ] **Step 9:** Commit: `feat: add product page with momentum gallery and contact buttons`

---

### Task 7: Yönetim — giriş, ürün listesi ve ürün formu

**Files:**
- Create: `src/app/auth/callback/route.ts`, `src/app/yonetim/giris/page.tsx`, `sifre-yenile/page.tsx`, `(panel)/layout.tsx`, `(panel)/page.tsx`, `(panel)/urun/yeni/page.tsx`, `(panel)/urun/[id]/page.tsx`, `actions/auth.ts`, `actions/products.ts`, `src/lib/validation.ts`, `src/lib/image.ts` (`resizeToWebp` eklenir), `src/components/admin/product-form.tsx`, `admin/image-picker.tsx`
- Test: `tests/unit/validation.test.ts`, `tests/rls/products-action.test.ts`

**Interfaces:**
- Consumes: `createServerSupabase`, `createBrowserSupabase`, `slugify`, `uniqueSlug`, `fitWithin`.
- Produces:
  - `type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }`: `error` Türkçe ve kullanıcıya gösterilebilir
  - `ImageInput { path_thumb: string; path_full: string; width: number; height: number }`
  - `productSchema` (zod): `{ id?: uuid, title: 1–120 karakter (trim), description: ≤5000, categoryId: uuid, status: "published" | "draft", images: ImageInput[] (≤8) }`; `status === "published"` iken `images.length >= 1` zorunlu, mesaj "Yayınlamak için en az bir fotoğraf ekleyin."
  - `saveProduct(input: unknown): Promise<ActionResult<{ id: string; slug: string }>>`
  - `deleteProduct(id: string): Promise<ActionResult<null>>`
  - `signIn(formData)`, `signOut()`, `requestPasswordReset(formData)`, `updatePassword(formData)`
  - `resizeToWebp(file: File, max: number, quality?: number): Promise<{ blob: Blob; width: number; height: number }>`: `createImageBitmap(file, { imageOrientation: "from-image" })` + canvas `toBlob("image/webp", 0.82)`

- [ ] **Step 1: Failing doğrulama testleri:**
  - Fotoğrafsız `published` → hata ve yukarıdaki mesaj.
  - Fotoğrafsız `draft` → geçerli.
  - 9 fotoğraf → "En fazla 8 fotoğraf eklenebilir."
  - `"   "` başlık → "Ürün adı gerekli."
  - 121 karakter başlık → hata.
- [ ] **Step 2:** Çalıştır → FAIL. **Step 3:** `validation.ts`'i uygula. **Step 4:** PASS.
- [ ] **Step 5: Failing action testleri** (canlı Supabase, admin oturumuyla server client'ı taklit eden yardımcıyla; ya da action'ın çekirdeğini `saveProductWith(client, input)` olarak ayırıp onu test et):
  - Yeni ürün slug alır ve aynı adla ikinci ürün `-2` alır.
  - İlk yayında `published_at` dolar, taslağa alıp tekrar yayınlayınca değişmez.
  - Düzenlemede ad değişse de slug değişmez.
  - Fotoğraf listesi değişince eski `product_images` satırları gider, yeniler sırayla yazılır, artık kullanılmayan dosyalar storage'dan silinir.
  - `deleteProduct` ürünü, fotoğraf satırlarını ve dosyaları siler.
  - Admin olmayan kullanıcı → `{ ok: false }`.
- [ ] **Step 6:** Çalıştır → FAIL. **Step 7:** Uygula.
  - `saveProduct` sırası: doğrula → `is_admin` kontrolü → ürünü upsert et → fotoğraf satırlarını değiştir → kaldırılan dosyaları sil → `revalidatePath("/")`, `revalidatePath("/urun/" + slug)`.
  - `deleteProduct` sırası: dosya yollarını oku → ürünü sil (cascade) → dosyaları sil → `revalidatePath`.
- [ ] **Step 8:** PASS.
- [ ] **Step 9:** Arayüzü kur.
  - **Giriş sayfası:** e-posta ve şifre alanları, "Şifremi unuttum" bağlantısı. Sıfırlama `redirectTo: NEXT_PUBLIC_SITE_URL + "/auth/callback?next=/yonetim/sifre-yenile"` ile yapılır. `auth/callback` code'u oturuma çevirir ve `next` adresine yönlendirir; `next` yalnızca `/` ile başlayan iç yollar olabilir.
  - **Panel layout'u:** sunucuda `is_admin` kontrolü yapar, admin değilse oturumu kapatıp girişe yönlendirir. Alt sekme çubuğunda "Ürünler", "Kategoriler", "Ayarlar" ve "Siteyi gör" bulunur; ayrıca "Çıkış" butonu vardır.
  - **Ürün listesi:** kapak, ad, kategori ve "Yayında" / "Taslak" etiketi. Üstte "Yeni ürün" butonu.
  - **ImagePicker:**
    - `<input type="file" accept="image/*" multiple>` ile seçim yapılır. Her dosya iki boyutta küçültülür.
    - Dosyalar `products/<batchId>/<uuid>-thumb.webp` ve `-full.webp` yollarına browser client ile yüklenir; her fotoğrafta ilerleme ve hata durumu gösterilir.
    - Okunamayan dosya için mesaj: "Bu fotoğraf açılamadı, başka bir fotoğraf deneyin."
    - Sıralama `motion` `Reorder` ile yapılır; erişilebilirlik için her fotoğrafta "sola / sağa taşı" butonları da olur.
    - İlk fotoğrafta "Kapak" etiketi görünür. Fotoğraf kaldırma butonu vardır.
  - **ProductForm:**
    - Alanlar: ad, açıklama (textarea), kategori seçimi, "Yayında" anahtarı, Kaydet. Silme yalnızca düzenleme sayfasında olur ve onay ister.
    - Kaydet butonu istek sürerken devre dışıdır ve "Kaydediliyor…" yazar; yükleme bitmeden kaydetmeye izin vermez.
    - `saveProduct` hata dönerse ya da sayfa kayıt olmadan terk edilirse, bu oturumda yüklenip kaydedilmemiş dosyalar browser client ile silinir (`beforeunload` + hata yolu).
    - Başarıda "Kaydedildi" bildirimi gösterilir ve listeye dönülür.
    - Mobilde Kaydet butonu yapışkan alt çubukta durur, klavye açıkken de görünür kalır (`position: sticky; bottom: env(safe-area-inset-bottom)`).
- [ ] **Step 10:** `scripts/create-admin.ts` ile bir test admini oluştur; manuel kontrol yap: telefon boyutunda giriş → 3 fotoğraflı ürün ekle → sitede görünüyor → taslağa al → ürün sayfası 404 → sil.
- [ ] **Step 11:** Commit: `feat: add admin login and product management`

---

### Task 8: Yönetim — kategoriler ve site ayarları

**Files:**
- Create: `(panel)/kategoriler/page.tsx`, `(panel)/ayarlar/page.tsx`, `actions/categories.ts`, `actions/settings.ts`, `components/admin/category-list.tsx`, `components/admin/settings-form.tsx`
- Modify: `src/lib/validation.ts`
- Test: `tests/unit/validation.test.ts` (ekleme), `tests/rls/categories-action.test.ts`

**Interfaces:**
- Consumes: `ActionResult`, `normalizeTrPhone`, `slugify`, `uniqueSlug`.
- Produces: `saveCategory({ id?, name })`, `deleteCategory(id)`, `reorderCategories(ids: string[])`, `saveSettings(input)`; tümü `Promise<ActionResult<…>>`.

- [ ] **Step 1: Failing testler:**
  - `settingsSchema`: `whatsapp_number: "0532 123 45 67"` → `905321234567` olarak normalize edilir.
  - `"123"` → "Geçerli bir cep telefonu numarası girin (ör. 0532 123 45 67)."
  - Boş string → `null` (izinli).
  - `instagram_username: "@rose.patisserie.tr"` → `rose.patisserie.tr`.
  - `tagline` 1–120 karakter, `about_text` ≤3000 karakter.
  - `deleteCategory` ürünü olan kategoride `{ ok: false, error: "Bu kategoride ürünler var. Önce ürünleri başka kategoriye taşıyın." }` döner.
  - `reorderCategories` `sort_order`'ı verilen sıraya göre 0..n yazar.
- [ ] **Step 2:** FAIL. **Step 3:** Uygula. Her action sonunda `revalidatePath("/", "layout")` çağrılır (kategori ve ayarlar tüm sayfaları etkiler). **Step 4:** PASS.
- [ ] **Step 5:** Arayüz:
  - **Kategoriler:** liste, satır içi yeniden adlandırma, sürükleyerek ya da yukarı/aşağı butonlarıyla sıralama, ekleme alanı, silme (onaylı; hata mesajı satırda gösterilir).
  - **Ayarlar:** WhatsApp numarası, Instagram kullanıcı adı, karşılama cümlesi, hakkında metni ve Kaydet.
- [ ] **Step 6:** Commit: `feat: add category and site settings management`

---

### Task 9: Canlıya alma, duraklatma önlemi ve uçtan uca test

**Files:**
- Create: `src/app/api/cron/keepalive/route.ts`, `vercel.json`, `e2e/admin-flow.spec.ts`, `playwright.config.ts`
- Test: `tests/unit/keepalive.test.ts`, `e2e/admin-flow.spec.ts`

**Interfaces:**
- Consumes: her şey.
- Produces: `GET /api/cron/keepalive`. `Authorization: Bearer <CRON_SECRET>` yoksa 401 döner. Varsa `site_settings`'ten bir satır okur ve `{ ok: true }` döner.

- [ ] **Step 1: Failing test:** Handler, yanlış ya da eksik header'da 401 döner. Supabase istemcisi enjekte edilebilir parametre olarak verilir ve testte sahte istemci kullanılır.
- [ ] **Step 2:** FAIL → uygula → PASS.
- [ ] **Step 3:** `vercel.json`: `{ "crons": [{ "path": "/api/cron/keepalive", "schedule": "0 6 * * *" }] }`.
- [ ] **Step 4:** `e2e/admin-flow.spec.ts` (Playwright, `devices["iPhone 14"]`, `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` ortam değişkenleri):
  - Giriş yap. Kategori yoksa oluştur.
  - `tests/fixtures/` altındaki iki JPEG ile "E2E Test Pastası" ürününü ekle ve yayınla.
  - Ana sayfada kartı ve ürün sayfasında başlığı gör. WhatsApp `href`'inin `wa.me` içerdiğini ve mesajda ürün adının geçtiğini doğrula.
  - Ürünü taslağa al → ürün sayfası 404.
  - Ürünü sil → panel listesinde yok.
  - Ayrı test: ağ isteği `storage/v1/object` için ikinci yüklemede `route.abort()` edilir → formda hata görünür ve kayıt butonu ürün oluşturmaz (Review Focus 3).
- [ ] **Step 5:** Yerelde `npm run build && npm start` iken `npm run e2e` → PASS.
- [ ] **Step 6:** Canlıya alma. Bu adım kullanıcının `vercel login` yapmasını gerektirir; giriş yoksa dur ve kullanıcıdan iste.
  - `vercel link` ile yeni bir proje oluştur (`rose-patisserie`).
  - `vercel env add` ile `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` (rastgele 32 bayt hex) ve `NEXT_PUBLIC_SITE_URL` (canlı adres) değişkenlerini production'a ekle.
  - `vercel --prod` ile yayınla.
  - Supabase'de Site URL'yi ve Redirect URL'lerine `<canlı adres>/**` ekle.
- [ ] **Step 7:** Canlı doğrulama:
  - Ana sayfa açılıyor.
  - `curl -i <canlı>/api/cron/keepalive` → 401; doğru header ile → 200.
  - WhatsApp'ta paylaşılan ürün bağlantısı fotoğraflı önizleme veriyor.
  - Chrome DevTools Lighthouse (mobil) ana sayfa ve ürün sayfasında Performance ≥90, Accessibility ≥90. Altındaysa nedenini düzelt ve tekrar ölç.
- [ ] **Step 8:** Gerçek admin hesabı: işletme sahibinin e-postasıyla `create-admin.ts` çalıştırılır (e-posta gelene kadar bekler; geçici şifre kullanıcıya iletilir ve ilk girişte "Şifremi unuttum" ile değiştirilmesi önerilir). E2E test admini silinir.
- [ ] **Step 9:** Commit: `feat: add keepalive cron, e2e tests and deployment config`

# Rose Patisserie Web Sitesi — Tasarım

Tarih: 2026-11-19
Durum: Onaylandı (2026-11-19)

## 1. Amaç

Rose Patisserie, Bursa Yıldırım'da ev yapımı cupcake, cheesecake ve benzeri tatlılar üreten küçük bir işletmedir. Şu an yalnızca Instagram'da (`@rose.patisserie.tr`) yer alıyor ve siparişleri DM ile alıyor.

Site bir **vitrin** olacak. Ziyaretçi ürünleri görür, beğenir ve siparişi **WhatsApp veya Instagram** üzerinden verir. İşletme sahibi (kullanıcının kuzeni) ürünleri teknik bilgi gerekmeden, telefondan, Instagram'a gönderi atar gibi kendisi ekler ve yönetir.

## 2. Hedefler

- Ziyaretçi, Instagram'dan gelip ürünleri telefonda hızlıca gezebilmeli.
- Her ürün sayfasından tek dokunuşla, ürün adıyla hazır yazılmış WhatsApp mesajı açılabilmeli.
- İşletme sahibi, telefonundan ürün ekleyebilmeli, düzenleyebilmeli, gizleyebilmeli ve silebilmeli.
- Site, apple-design skill'inin (emilkowalski/skills) hissini taşımalı.
- Aylık maliyet sıfır ya da sıfıra yakın olmalı.

## 3. Kapsam dışı

- Sepet, online ödeme, sipariş takibi.
- Fiyat gösterimi. Ürünlerde yalnızca "Fiyat için yazın" yazar.
- Ziyaretçi hesabı, yorum, beğeni.
- Instagram'dan otomatik ürün çekme.
- Birden fazla dil. Site yalnızca Türkçe olacak.

## 4. Başarısızlık sayılacak durumlar

Site teknik olarak çalışsa bile şunlar başarısızlık sayılır:
- İşletme sahibinin ürün eklemek için birinden yardım istemesi gerekiyorsa.
- Telefonla çekilmiş fotoğraflar yüzünden site yavaş açılıyorsa.
- Tasarım hazır şablon gibi duruyorsa ya da markanın sıcak, ev yapımı havasını kaybetmişse.

## 5. Kısıtlar

- Proje `C:\Projects\rose-patisserie` klasöründe kendi git deposunda duracak. Masaüstü ve ana klasördeki mevcut depolara dokunulmayacak.
- Hesaplar kullanıcıya ait olacak: Supabase ve barındırma (bkz. 7.6). İşletme sahibi yalnızca yönetim paneline giriş yapacak.
- Supabase hesabında zaten bir aktif ve bir duraklatılmış ücretsiz proje var. Yeni proje, ücretsiz plandaki iki aktif proje sınırına denk geliyor.
- Ücretsiz Supabase projeleri yedi gün hareketsiz kalırsa duraklatılır (bkz. 7.7).

## 6. Değerlendirilen yaklaşımlar

| Yaklaşım | Artısı | Eksisi |
|---|---|---|
| **A) Kendi site + kendi Türkçe panel (Next.js, Supabase)** — *seçildi* | Panel tam ihtiyaca göre ve Türkçe; apple-design her yere uygulanabilir; ücretsiz | En çok kurulum işi; bakım bize düşer |
| B) Kendi site + hazır CMS (ör. Sanity) | Panel hazır gelir | Panel İngilizce ve karmaşık; ayrı hesap; telefonda zahmetli |
| C) Wix / Squarespace | Kurulum kolay | apple-design hissi uygulanamaz; aylık ücret |

Kullanıcı A'yı seçti. Gerekçe: İşletme sahibi ürünü telefondan, Instagram'a gönderi atar gibi kolayca ekleyebilmeli; bunu en iyi kendi panelimiz sağlar.

## 7. Tasarım

### 7.1 Ziyaretçi sayfaları

**Ana sayfa (`/`)**
- Logo ve kısa karşılama cümlesi ("Her tatlıda küçük bir mutluluk").
- Kategori düğmeleri: `Tümü` ve panelden tanımlanan kategoriler. Seçim URL'ye yazılır (`/?kategori=cheesecake`); paylaşılabilir ve geri tuşu çalışır.
- Ürün ızgarası, en yeni ürün en üstte. Telefonda 2 sütun, tablette 3, masaüstünde 4. Kartta kapak fotoğrafı, ürün adı ve tarih olur.
- Ürün sayısı artınca "Daha fazla göster" ile sayfalama yapılır (ilk 24 ürün).

**Ürün sayfası (`/urun/[slug]`)**
- Kaydırmalı fotoğraf galerisi: parmakla sürükleme, nokta göstergesi, masaüstünde ok tuşları.
- Ürün adı, kategori, yayın tarihi ve açıklama (paragrafları korunan düz metin).
- "Fiyat için yazın" notu.
- **WhatsApp'tan yaz** butonu: `https://wa.me/<numara>?text=<mesaj>`. Mesaj şablonu: "Merhaba, *<ürün adı>* hakkında bilgi almak istiyorum." Mesaja ürünün bağlantısı da eklenir.
- **Instagram** butonu, işletmenin profiline gider.
- Paylaşım önizlemesi için Open Graph etiketleri olur: ürün adı, açıklamanın başı ve kapak fotoğrafı. Böylece WhatsApp'ta paylaşılan bağlantı fotoğraflı görünür.

**Hakkında (`/hakkinda`)**
- Panelden düzenlenen metin, konum (Bursa Yıldırım), WhatsApp ve Instagram bağlantıları.

**Ortak öğeler**
- Buzlu cam efektli, yapışkan üst menü: logo, Ürünler, Hakkında.
- Alt bilgi: Instagram, WhatsApp ve © yılı.
- 404 sayfası; gizlenen ya da silinen ürünler 404 döner.
- Ürün yoksa boş durum mesajı: "Yakında yeni lezzetler burada."

### 7.2 Yönetim paneli (`/yonetim`)

- **Giriş:** E-posta ve şifreyle (Supabase Auth). Dışarıdan kayıt kapalı. Yetkili kullanıcı `admins` tablosunda tutulur. Şifre sıfırlama Supabase'in kendi e-postasıyla yapılır.
- **Ürün listesi:** Kapak, ad, kategori ve durum (Yayında / Taslak). Üstte "Yeni ürün" butonu.
- **Ürün formu:**
  - Fotoğraflar: telefon galerisinden en fazla 8 fotoğraf seçilir. Sıra sürükleyerek değiştirilir; ilk fotoğraf kapaktır. Yüklemede ilerleme gösterilir.
  - Ad (zorunlu), açıklama, kategori (zorunlu).
  - Durum düğmesi: Yayında / Taslak.
  - Kaydet. Sil işlemi onay ister.
- **Kategoriler:** Ekleme, yeniden adlandırma, sıralama ve silme. İçinde ürün olan kategori silinemez; panel bunu açıklar.
- **Ayarlar:** WhatsApp numarası, Instagram kullanıcı adı, karşılama cümlesi, hakkında metni.
- Panel telefon öncelikli tasarlanır: büyük dokunma alanları, kaydet butonu klavye açıkken de erişilebilir.
- Her kaydetmeden sonra ilgili ziyaretçi sayfaları yenilenir (on-demand revalidation). Değişiklik birkaç saniye içinde sitede görünür.

### 7.3 Fotoğraflar

- Telefon fotoğrafları büyüktür (3–8 MB). Fotoğraf yüklenmeden önce **tarayıcıda** küçültülür ve iki boyutta WebP'ye çevrilir:
  - `thumb`: uzun kenar 640 px, kartlar için.
  - `full`: uzun kenar 1600 px, galeri için.
- Telefonun EXIF döndürme bilgisi uygulanır; konum bilgisi gibi meta veriler silinir (gizlilik).
- Dosyalar Supabase Storage'daki herkese açık `product-images` kovasında tutulur. Yazma yetkisi yalnızca admin'dedir.
- Ürün ya da fotoğraf silinince dosyalar da silinir.
- Gerekçe: Sunucu tarafı görsel dönüştürme Supabase'de ücretli; Vercel/Netlify görsel optimizasyonunun da kotası var. İstemcide küçültme ikisine de ihtiyaç bırakmaz.

### 7.4 Veri modeli (Supabase Postgres)

```
categories      id, name, slug (benzersiz), sort_order, created_at
products        id, title, slug (benzersiz), description, category_id → categories,
                status ('published' | 'draft'), published_at, created_at, updated_at
product_images  id, product_id → products (cascade), path_thumb, path_full,
                width, height, sort_order
site_settings   tek satır: whatsapp_number, instagram_username, tagline, about_text
admins          user_id → auth.users
```

- Slug'lar Türkçe karakterler dönüştürülerek üretilir (`Şıpsevdi Kek` → `sipsevdi-kek`). Çakışmada sona sayı eklenir.
- **RLS:** Ziyaretçi (anon) yalnızca `status = 'published'` olan ürünleri, onların fotoğraflarını, kategorileri ve ayarları okuyabilir. Yazma işlemleri yalnızca `admins` içindeki kullanıcıya açıktır. Storage kovası için de aynı kural geçerlidir.
- Tablolar migration dosyalarıyla oluşturulur.

### 7.5 Görünüm ve his (apple-design)

Skill dosyası okundu (yalnızca `SKILL.md`). Uygulanacak kurallar:
- **Anında tepki:** Butonlar ve kartlar basıldığı anda küçülür (`scale(0.97)`, 100 ms ease-out). Bırakmayı beklemez.
- **Yaylar:** Geçişler sabit süreli değil, yay animasyonuyla yapılır: varsayılan `bounce: 0`, yaklaşık 0.35–0.4 sn. Galeri kaydırması parmağın hızını devralır ve en yakın fotoğrafa oturur (momentum projeksiyonu). Uçlarda lastik bant direnci olur.
- **Kesilebilirlik:** Animasyon sürerken kullanıcı etkileşimi kilitlenmez.
- **Uzamsal tutarlılık:** Ürün kartından ürün sayfasına geçişte kapak fotoğrafı yerinden büyür (View Transitions API; desteklenmeyen tarayıcıda düz geçiş).
- **Malzemeler:** Üst menü buzlu camdır (`backdrop-filter: blur() saturate()`). Altında çizgi yerine kaydırma kenarı gölgelenmesi olur. Saydam yüzeyler üst üste konmaz.
- **Tipografi:** Sistem fontu (`system-ui, -apple-system, sans-serif`). Büyük başlıklarda negatif harf aralığı (-0.02em) ve sıkı satır aralığı kullanılır; ölçüler `rem` cinsindendir.
- **Erişilebilirlik:** `prefers-reduced-motion` açıkken yalnızca opaklık geçişi olur. `prefers-reduced-transparency` açıkken bulanıklık kalkar ve zemin opak olur. Klavye ile gezilebilir, görünür odak halkası olur. Fotoğrafların alt metni ürün adından üretilir.
- **Renkler (logodan):** Krem zemin, gül pembesi vurgu, sıcak koyu kahve metin, ince altın detaylar. Kesin değerler logodan örneklenir ve kontrast oranı en az 4.5:1 olacak şekilde ayarlanır. Karanlık mod da desteklenir.

### 7.6 Teknoloji

- **Next.js** (App Router, TypeScript), **Tailwind CSS**.
- Yay ve jest animasyonları için **Motion** kütüphanesi.
- Veritabanı, kimlik doğrulama ve dosya depolama için **Supabase**. Yeni bir proje açılır; bölge `eu-central-1` (Frankfurt), Türkiye'ye en yakın seçenek.
- Supabase oturumu için `@supabase/ssr`. Panel rotaları sunucu tarafında korunur.
- **Barındırma: Vercel ücretsiz (Hobby) plan.** Kullanıcının kararı. Bilinen risk: Hobby planı yalnızca ticari olmayan kişisel kullanıma izin veriyor; bir işletme sitesi bu koşula aykırı ve hesap kısıtlanabilir. Kod barındırmaya bağımlı yazılmaz, böylece ileride Vercel Pro'ya ya da Netlify'a geçmek yalnızca yeniden yayınlamak ve ortam değişkenlerini taşımak demek olur.
- **Alan adı: karar bekliyor.** Ücretsiz alt alan adıyla başlanabilir; ileride bir alan adı (ör. `rosepatisserie.com.tr`) bağlanabilir.

### 7.7 Duraklatma önlemi

Ziyaretçi sayfaları önbellekten sunulduğu için veritabanı günlerce hiç sorgulanmayabilir. Bu durumda ücretsiz Supabase projesi yedi günün sonunda duraklatılır. Önlem olarak günde bir kez, veritabanına hafif bir sorgu atan zamanlanmış bir görev (Vercel Cron; Hobby planı günde bir çalıştırmaya izin verir) çalışır. Uç nokta bir gizli anahtarla korunur.

### 7.8 Test ve doğrulama

- Birim testleri: Türkçe slug üretimi, WhatsApp bağlantısı oluşturma, momentum projeksiyonu ve lastik bant hesapları.
- RLS testleri: anon kullanıcı taslak ürünü okuyamaz ve hiçbir şey yazamaz; admin olmayan giriş yapmış kullanıcı da yazamaz.
- Uçtan uca test (Playwright, telefon ekran boyutunda): giriş → ürün ekle → sitede görünüyor → gizle → 404 → sil.
- Lighthouse: telefonda performans ve erişilebilirlik puanı en az 90.

## 8. Geliştiriciye bırakılanlar

- Bileşen yapısı ve dosya düzeni.
- Tam renk değerleri (logodan örneklenecek).
- Karşılama alanının yerleşimi ve boş durum metinleri.
- Panel formunun ayrıntıları; yukarıdaki işlevler korunmak kaydıyla.

## 9. İşletme sahibinden gerekenler (kodlamayı engellemez)

- Logo dosyası (mümkünse yüksek çözünürlüklü PNG ya da SVG).
- WhatsApp numarası.
- Panel girişi için e-posta adresi.
- Hakkında metni (yazılmazsa geçici bir metin konur, panelden değiştirilir).
- İlk ürünlerin fotoğrafları ve açıklamaları (panelden kendisi girecek).

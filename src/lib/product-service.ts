import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify, uniqueSlug } from "./slug";
import { IMAGE_BUCKET } from "./storage";
import type { ActionResult } from "./types";
import { parseProductInput, type ImageInput } from "./validation";

// Ürün kaydetme/silme çekirdeği. İstemciyi parametre alır: Server Action'lar oturumlu istemciyle çağırır,
// testler canlı Supabase'e karşı çalıştırır. Yetki kararının asıl yeri RLS'tir; buradaki admin kontrolü
// kullanıcıya anlaşılır hata vermek içindir.

const SLUG_MAX = 80;
const GENERIC_ERROR = "Kaydedilemedi, lütfen tekrar deneyin.";

type DbError = { code?: string; message: string };

export async function isAdmin(client: SupabaseClient): Promise<boolean> {
  // admins tablosunda RLS yalnızca kullanıcının kendi satırını gösterir.
  const { data, error } = await client.from("admins").select("user_id").limit(1);
  return !error && (data?.length ?? 0) > 0;
}

function dbMessage(error: DbError): string {
  if (error.code === "23503") return "Seçilen kategori bulunamadı.";
  if (error.code === "42501") return "Bu işlem için yetkiniz yok.";
  return GENERIC_ERROR;
}

function baseSlug(title: string): string {
  return slugify(title).slice(0, SLUG_MAX).replace(/-+$/, "") || "urun";
}

async function insertDraft(client: SupabaseClient, title: string, categoryId: string) {
  const base = baseSlug(title);
  // Aynı anda iki kayıt aynı slug'ı alırsa benzersizlik kısıtı yakalar; birkaç kez yeniden denenir.
  for (let attempt = 0; attempt < 3; attempt++) {
    const taken = await client.from("products").select("slug").like("slug", `${base}%`);
    if (taken.error) return { error: taken.error };
    const slug = uniqueSlug(base, taken.data.map((r) => r.slug as string));
    const { data, error } = await client
      .from("products")
      .insert({ title, slug, category_id: categoryId, status: "draft", published_at: null })
      .select("id, slug")
      .single();
    if (!error) return { data: data as { id: string; slug: string } };
    if (error.code !== "23505") return { error };
  }
  return { error: { message: "slug çakışması" } as DbError };
}

/** Fotoğraf satırlarını verilen sırayla yazar: önce yenileri ekler, sonra eskileri siler (hata olursa eskiler kalır). */
async function replaceImages(client: SupabaseClient, productId: string, images: ImageInput[]): Promise<DbError | null> {
  let keepIds: string[] = [];
  if (images.length) {
    const { data, error } = await client
      .from("product_images")
      .insert(images.map((img, i) => ({ ...img, product_id: productId, sort_order: i })))
      .select("id");
    if (error) return error;
    keepIds = data.map((r) => r.id as string);
  }
  let del = client.from("product_images").delete().eq("product_id", productId);
  if (keepIds.length) del = del.not("id", "in", `(${keepIds.join(",")})`);
  const { error } = await del;
  return error;
}

async function removeFiles(client: SupabaseClient, paths: string[]) {
  if (!paths.length) return;
  const { error } = await client.storage.from(IMAGE_BUCKET).remove(paths);
  // Kayıt zaten tamam; silinemeyen dosya yalnızca depoda yer kaplar.
  if (error) console.warn("Fotoğraf dosyaları silinemedi:", error.message);
}

const imagePaths = (images: { path_thumb: string; path_full: string }[]) =>
  images.flatMap((i) => [i.path_thumb, i.path_full]);

export async function saveProductWith(
  client: SupabaseClient,
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const parsed = parseProductInput(input);
  if (!parsed.ok) return parsed;
  const p = parsed.data;

  if (!(await isAdmin(client))) return { ok: false, error: "Bu işlem için yetkiniz yok." };

  let id: string;
  let slug: string;
  let publishedAt: string | null;
  let oldPaths: string[] = [];
  const isNew = !p.id;

  if (p.id) {
    const { data, error } = await client
      .from("products")
      .select("id, slug, published_at, product_images(path_thumb, path_full)")
      .eq("id", p.id)
      .maybeSingle();
    if (error) return { ok: false, error: GENERIC_ERROR };
    if (!data) return { ok: false, error: "Ürün bulunamadı." };
    ({ id, slug } = data);
    publishedAt = data.published_at;
    oldPaths = imagePaths(data.product_images ?? []);
  } else {
    // Yeni ürün önce taslak oluşur; fotoğraflar yazılmadan sitede görünmez.
    const created = await insertDraft(client, p.title, p.categoryId);
    if (created.error) return { ok: false, error: dbMessage(created.error) };
    ({ id, slug } = created.data);
    publishedAt = null;
  }

  const imageError = await replaceImages(client, id, p.images);
  if (imageError) {
    if (isNew) await client.from("products").delete().eq("id", id);
    return { ok: false, error: dbMessage(imageError) };
  }

  // İlk yayın tarihi bir kez yazılır; taslağa alıp yeniden yayınlamak sırayı bozmaz.
  if (p.status === "published" && !publishedAt) publishedAt = new Date().toISOString();

  const { error: updateError } = await client
    .from("products")
    .update({
      title: p.title,
      description: p.description,
      category_id: p.categoryId,
      status: p.status,
      published_at: publishedAt,
    })
    .eq("id", id);
  if (updateError) {
    if (isNew) await client.from("products").delete().eq("id", id);
    return { ok: false, error: dbMessage(updateError) };
  }

  const keep = new Set(imagePaths(p.images));
  await removeFiles(client, oldPaths.filter((path) => !keep.has(path)));

  return { ok: true, data: { id, slug } };
}

export async function deleteProductWith(client: SupabaseClient, id: string): Promise<ActionResult<null>> {
  if (!(await isAdmin(client))) return { ok: false, error: "Bu işlem için yetkiniz yok." };

  const { data: images, error: readError } = await client
    .from("product_images")
    .select("path_thumb, path_full")
    .eq("product_id", id);
  if (readError) return { ok: false, error: "Silinemedi, lütfen tekrar deneyin." };

  // Fotoğraf satırları cascade ile silinir; dosyalar ürün silindikten sonra kaldırılır.
  const { data, error } = await client.from("products").delete().eq("id", id).select("id");
  if (error) return { ok: false, error: "Silinemedi, lütfen tekrar deneyin." };
  if (!data.length) return { ok: false, error: "Ürün bulunamadı." };

  await removeFiles(client, imagePaths(images));
  return { ok: true, data: null };
}

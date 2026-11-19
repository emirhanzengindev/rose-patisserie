import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "./product-service";
import { slugify, uniqueSlug } from "./slug";
import type { ActionResult, Category, SiteSettings } from "./types";
import { parseCategoryName, parseSettingsInput } from "./validation";

// Kategori ve site ayarları çekirdeği. İstemciyi parametre alır (Server Action'lar ve canlı testler için).

const FORBIDDEN = { ok: false, error: "Bu işlem için yetkiniz yok." } as const;
const GENERIC = "Kaydedilemedi, lütfen tekrar deneyin.";
const HAS_PRODUCTS = "Bu kategoride ürünler var. Önce ürünleri başka kategoriye taşıyın.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CATEGORY_COLS = "id, name, slug, sort_order";

export async function saveCategoryWith(
  client: SupabaseClient,
  input: { id?: unknown; name?: unknown },
): Promise<ActionResult<Category>> {
  const name = parseCategoryName(input.name);
  if (!name.ok) return name;
  if (input.id !== undefined && (typeof input.id !== "string" || !UUID.test(input.id))) {
    return { ok: false, error: "Kategori bulunamadı." };
  }
  if (!(await isAdmin(client))) return FORBIDDEN;

  if (input.id) {
    // Yeniden adlandırmada slug değişmez: paylaşılmış /?kategori=… bağlantıları çalışmaya devam eder.
    const { data, error } = await client
      .from("categories")
      .update({ name: name.data })
      .eq("id", input.id)
      .select(CATEGORY_COLS)
      .maybeSingle();
    if (error) return { ok: false, error: GENERIC };
    return data ? { ok: true, data } : { ok: false, error: "Kategori bulunamadı." };
  }

  const last = await client.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  if (last.error) return { ok: false, error: GENERIC };
  const sortOrder = (last.data[0]?.sort_order ?? -1) + 1;
  const base = slugify(name.data).slice(0, 60).replace(/-+$/, "") || "kategori";

  // Aynı anda iki ekleme aynı slug'ı alırsa benzersizlik kısıtı yakalar; yeniden denenir.
  for (let attempt = 0; attempt < 3; attempt++) {
    const taken = await client.from("categories").select("slug").like("slug", `${base}%`);
    if (taken.error) return { ok: false, error: GENERIC };
    const slug = uniqueSlug(base, taken.data.map((r) => r.slug as string));
    const { data, error } = await client
      .from("categories")
      .insert({ name: name.data, slug, sort_order: sortOrder })
      .select(CATEGORY_COLS)
      .single();
    if (!error) return { ok: true, data };
    if (error.code !== "23505") return { ok: false, error: GENERIC };
  }
  return { ok: false, error: GENERIC };
}

export async function reorderCategoriesWith(client: SupabaseClient, ids: unknown): Promise<ActionResult<null>> {
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > 200 ||
    !ids.every((id) => typeof id === "string" && UUID.test(id)) ||
    new Set(ids).size !== ids.length
  ) {
    return { ok: false, error: "Sıralama kaydedilemedi." };
  }
  if (!(await isAdmin(client))) return FORBIDDEN;

  const results = await Promise.all(
    (ids as string[]).map((id, i) => client.from("categories").update({ sort_order: i }).eq("id", id).select("id")),
  );
  if (results.some((r) => r.error || r.data?.length !== 1)) {
    return { ok: false, error: "Sıralama kaydedilemedi, sayfayı yenileyip tekrar deneyin." };
  }
  return { ok: true, data: null };
}

export async function deleteCategoryWith(client: SupabaseClient, id: unknown): Promise<ActionResult<null>> {
  if (typeof id !== "string" || !UUID.test(id)) return { ok: false, error: "Kategori bulunamadı." };
  if (!(await isAdmin(client))) return FORBIDDEN;

  // Admin taslakları da görür; taslak ürünü olan kategori de silinemez (veritabanı da engeller).
  const { count, error: countError } = await client
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if (countError) return { ok: false, error: "Silinemedi, lütfen tekrar deneyin." };
  if (count) return { ok: false, error: HAS_PRODUCTS };

  const { data, error } = await client.from("categories").delete().eq("id", id).select("id");
  if (error) return { ok: false, error: error.code === "23503" ? HAS_PRODUCTS : "Silinemedi, lütfen tekrar deneyin." };
  return data.length ? { ok: true, data: null } : { ok: false, error: "Kategori bulunamadı." };
}

export async function saveSettingsWith(client: SupabaseClient, input: unknown): Promise<ActionResult<SiteSettings>> {
  const parsed = parseSettingsInput(input);
  if (!parsed.ok) return parsed;
  if (!(await isAdmin(client))) return FORBIDDEN;

  const { data, error } = await client
    .from("site_settings")
    .update(parsed.data)
    .eq("id", 1)
    .select("whatsapp_number, instagram_username, tagline, about_text")
    .maybeSingle();
  if (error || !data) return { ok: false, error: GENERIC };
  return { ok: true, data };
}

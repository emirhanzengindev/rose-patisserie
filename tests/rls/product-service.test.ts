import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { deleteProductWith, saveProductWith } from "@/lib/product-service";
import { slugify } from "@/lib/slug";
import { IMAGE_BUCKET } from "@/lib/storage";
import { deleteUser, makeUser, runId, service, tinyWebp } from "./helpers";

let admin: { id: string; client: SupabaseClient };
let user: { id: string; client: SupabaseClient };
let categoryId: string;
const run = runId();
const batch = `test-${run}`;
const created: string[] = [];

/** Panelin yaptığı gibi bir fotoğrafın iki boyutunu yükler. */
async function upload(name: string) {
  const svc = service();
  const paths = { path_thumb: `products/${batch}/${name}-thumb.webp`, path_full: `products/${batch}/${name}-full.webp` };
  for (const path of Object.values(paths)) {
    const { error } = await svc.storage.from(IMAGE_BUCKET).upload(path, tinyWebp(), { contentType: "image/webp" });
    if (error) throw error;
  }
  return { ...paths, width: 1600, height: 1200 };
}

async function storedFiles(): Promise<string[]> {
  const { data, error } = await service().storage.from(IMAGE_BUCKET).list(`products/${batch}`, { limit: 100 });
  if (error) throw error;
  return data.map((f) => f.name).sort();
}

async function row(id: string) {
  const { data } = await service().from("products").select("slug, title, status, published_at").eq("id", id).maybeSingle();
  return data;
}

async function save(input: Record<string, unknown>) {
  const r = await saveProductWith(admin.client, { description: "", categoryId, status: "draft", images: [], ...input });
  if (!r.ok) throw new Error(r.error);
  created.push(r.data.id);
  return r.data;
}

beforeAll(async () => {
  admin = await makeUser(true);
  user = await makeUser(false);
  const cat = await service().from("categories").insert({ name: `Servis ${run}`, slug: `servis-${run}` }).select("id").single();
  if (cat.error) throw cat.error;
  categoryId = cat.data.id;
});

afterAll(async () => {
  const svc = service();
  await svc.from("products").delete().eq("category_id", categoryId);
  await svc.from("categories").delete().eq("id", categoryId);
  const files = await storedFiles().catch(() => []);
  if (files.length) await svc.storage.from(IMAGE_BUCKET).remove(files.map((f) => `products/${batch}/${f}`));
  await deleteUser(admin.id);
  await deleteUser(user.id);
});

describe("saveProductWith", () => {
  test("yeni ürün addan slug alır; aynı adlı ikinci ürün -2 alır", async () => {
    const title = `Fıstıklı Kek ${run}`;
    const a = await save({ title });
    const b = await save({ title });
    expect(a.slug).toBe(slugify(title));
    expect(b.slug).toBe(`${slugify(title)}-2`);
  });

  test("ilk yayında published_at dolar; taslağa alıp yeniden yayınlayınca değişmez", async () => {
    const photo = await upload("yayin");
    const p = await save({ title: `Yayın ${run}`, status: "draft", images: [photo] });
    expect((await row(p.id))!.published_at).toBeNull();

    await save({ id: p.id, title: `Yayın ${run}`, status: "published", images: [photo] });
    const first = (await row(p.id))!.published_at;
    expect(first).not.toBeNull();

    await save({ id: p.id, title: `Yayın ${run}`, status: "draft", images: [photo] });
    await save({ id: p.id, title: `Yayın ${run}`, status: "published", images: [photo] });
    expect((await row(p.id))!.published_at).toBe(first);
  });

  test("düzenlemede ad değişse de slug değişmez", async () => {
    const p = await save({ title: `Eski Ad ${run}` });
    const edited = await save({ id: p.id, title: `Yeni Ad ${run}` });
    expect(edited.slug).toBe(p.slug);
    expect((await row(p.id))!.title).toBe(`Yeni Ad ${run}`);
  });

  test("fotoğraf listesi değişince satırlar yeni sırayla yazılır, kaldırılan dosyalar silinir", async () => {
    const [a, b, c] = [await upload("a"), await upload("b"), await upload("c")];
    const p = await save({ title: `Fotoğraflı ${run}`, images: [a, b] });

    await save({ id: p.id, title: `Fotoğraflı ${run}`, images: [c, a] });

    const { data: images } = await service()
      .from("product_images")
      .select("path_thumb, sort_order")
      .eq("product_id", p.id)
      .order("sort_order");
    expect(images).toEqual([
      { path_thumb: c.path_thumb, sort_order: 0 },
      { path_thumb: a.path_thumb, sort_order: 1 },
    ]);
    const files = await storedFiles();
    expect(files).not.toContain("b-thumb.webp");
    expect(files).not.toContain("b-full.webp");
    expect(files).toEqual(expect.arrayContaining(["a-thumb.webp", "a-full.webp", "c-thumb.webp", "c-full.webp"]));
  });

  test("admin olmayan kullanıcı kaydedemez", async () => {
    const r = await saveProductWith(user.client, {
      title: `Yetkisiz ${run}`,
      description: "",
      categoryId,
      status: "draft",
      images: [],
    });
    expect(r.ok).toBe(false);
  });

  test("olmayan ürünü düzenlemek hata verir", async () => {
    const r = await saveProductWith(admin.client, {
      id: "00000000-0000-4000-8000-000000000000",
      title: "Yok",
      description: "",
      categoryId,
      status: "draft",
      images: [],
    });
    expect(r).toEqual({ ok: false, error: "Ürün bulunamadı." });
  });

  test("geçersiz giriş doğrulama mesajı döner", async () => {
    const r = await saveProductWith(admin.client, { title: "", description: "", categoryId, status: "draft", images: [] });
    expect(r).toEqual({ ok: false, error: "Ürün adı gerekli." });
  });
});

describe("deleteProductWith", () => {
  test("ürünü, fotoğraf satırlarını ve dosyaları siler", async () => {
    const d = await upload("silinecek");
    const p = await save({ title: `Silinecek ${run}`, images: [d] });

    const r = await deleteProductWith(admin.client, p.id);
    expect(r).toEqual({ ok: true, data: null });
    expect(await row(p.id)).toBeNull();
    const { count } = await service().from("product_images").select("id", { count: "exact", head: true }).eq("product_id", p.id);
    expect(count).toBe(0);
    const files = await storedFiles();
    expect(files).not.toContain("silinecek-thumb.webp");
    expect(files).not.toContain("silinecek-full.webp");
  });

  test("admin olmayan kullanıcı silemez", async () => {
    const p = await save({ title: `Korunan ${run}` });
    const r = await deleteProductWith(user.client, p.id);
    expect(r.ok).toBe(false);
    expect(await row(p.id)).not.toBeNull();
  });
});

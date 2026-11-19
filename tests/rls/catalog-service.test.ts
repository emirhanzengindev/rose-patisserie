import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  deleteCategoryWith,
  reorderCategoriesWith,
  saveCategoryWith,
  saveSettingsWith,
} from "@/lib/catalog-service";
import { slugify } from "@/lib/slug";
import { deleteUser, makeUser, runId, service } from "./helpers";

let admin: { id: string; client: SupabaseClient };
let user: { id: string; client: SupabaseClient };
const run = runId();
const created: string[] = [];
let originalSettings: Record<string, unknown>;

async function add(name: string) {
  const r = await saveCategoryWith(admin.client, { name });
  if (!r.ok) throw new Error(r.error);
  created.push(r.data.id);
  return r.data;
}

beforeAll(async () => {
  admin = await makeUser(true);
  user = await makeUser(false);
  const { data } = await service().from("site_settings").select("*").eq("id", 1).single();
  originalSettings = data!;
});

afterAll(async () => {
  const svc = service();
  await svc.from("products").delete().in("category_id", created);
  await svc.from("categories").delete().in("id", created);
  await svc.from("site_settings").update(originalSettings).eq("id", 1);
  await deleteUser(admin.id);
  await deleteUser(user.id);
});

describe("saveCategoryWith", () => {
  test("yeni kategori addan slug alır; aynı ad -2 alır; sona eklenir", async () => {
    const a = await add(`Çikolatalı ${run}`);
    const b = await add(`Çikolatalı ${run}`);
    expect(a.slug).toBe(slugify(`Çikolatalı ${run}`));
    expect(b.slug).toBe(`${a.slug}-2`);
    expect(b.sort_order).toBeGreaterThan(a.sort_order);
  });

  test("yeniden adlandırmada slug değişmez (paylaşılan bağlantılar bozulmaz)", async () => {
    const c = await add(`Eski ${run}`);
    const r = await saveCategoryWith(admin.client, { id: c.id, name: `Yeni ${run}` });
    expect(r).toEqual({ ok: true, data: { ...c, name: `Yeni ${run}` } });
  });

  test("boş ad reddedilir", async () => {
    expect(await saveCategoryWith(admin.client, { name: "  " })).toEqual({ ok: false, error: "Kategori adı gerekli." });
  });

  test("admin olmayan kullanıcı ekleyemez", async () => {
    const r = await saveCategoryWith(user.client, { name: `Yetkisiz ${run}` });
    expect(r.ok).toBe(false);
  });
});

describe("reorderCategoriesWith", () => {
  test("sort_order'ı verilen sıraya göre 0..n yazar", async () => {
    const [x, y, z] = [await add(`X ${run}`), await add(`Y ${run}`), await add(`Z ${run}`)];
    const r = await reorderCategoriesWith(admin.client, [z.id, x.id, y.id]);
    expect(r.ok).toBe(true);
    const { data } = await service().from("categories").select("id, sort_order").in("id", [x.id, y.id, z.id]);
    const order = Object.fromEntries(data!.map((c) => [c.id, c.sort_order]));
    expect([order[z.id], order[x.id], order[y.id]]).toEqual([0, 1, 2]);
  });

  test("geçersiz kimlik listesi reddedilir", async () => {
    expect((await reorderCategoriesWith(admin.client, ["yok"])).ok).toBe(false);
  });
});

describe("deleteCategoryWith", () => {
  test("ürünü olan kategori silinemez", async () => {
    const c = await add(`Dolu ${run}`);
    const p = await service()
      .from("products")
      .insert({ title: `Ürün ${run}`, slug: `urun-${run}`, category_id: c.id })
      .select("id")
      .single();
    expect(p.error).toBeNull();
    expect(await deleteCategoryWith(admin.client, c.id)).toEqual({
      ok: false,
      error: "Bu kategoride ürünler var. Önce ürünleri başka kategoriye taşıyın.",
    });
  });

  test("boş kategori silinir", async () => {
    const c = await add(`Boş ${run}`);
    expect(await deleteCategoryWith(admin.client, c.id)).toEqual({ ok: true, data: null });
    const { data } = await service().from("categories").select("id").eq("id", c.id);
    expect(data).toEqual([]);
  });

  test("admin olmayan kullanıcı silemez", async () => {
    const c = await add(`Korunan ${run}`);
    expect((await deleteCategoryWith(user.client, c.id)).ok).toBe(false);
    const { data } = await service().from("categories").select("id").eq("id", c.id);
    expect(data).toHaveLength(1);
  });
});

describe("saveSettingsWith", () => {
  test("numara ve kullanıcı adı normalize edilerek kaydedilir", async () => {
    const r = await saveSettingsWith(admin.client, {
      whatsapp_number: "0532 123 45 67",
      instagram_username: "@Rose.Patisserie.TR",
      tagline: "  Test cümlesi  ",
      about_text: "Satır 1\n\nSatır 2",
    });
    expect(r).toEqual({
      ok: true,
      data: {
        whatsapp_number: "905321234567",
        instagram_username: "rose.patisserie.tr",
        tagline: "Test cümlesi",
        about_text: "Satır 1\n\nSatır 2",
      },
    });
    const { data } = await service().from("site_settings").select("whatsapp_number, tagline").eq("id", 1).single();
    expect(data).toEqual({ whatsapp_number: "905321234567", tagline: "Test cümlesi" });
  });

  test("geçersiz numara kaydedilmez", async () => {
    const r = await saveSettingsWith(admin.client, { whatsapp_number: "123", instagram_username: "", tagline: "x", about_text: "" });
    expect(r.ok).toBe(false);
  });

  test("admin olmayan kullanıcı ayarları değiştiremez", async () => {
    const r = await saveSettingsWith(user.client, { whatsapp_number: "", instagram_username: "", tagline: "Ele geçirildi", about_text: "" });
    expect(r.ok).toBe(false);
    const { data } = await service().from("site_settings").select("tagline").eq("id", 1).single();
    expect(data!.tagline).not.toBe("Ele geçirildi");
  });
});

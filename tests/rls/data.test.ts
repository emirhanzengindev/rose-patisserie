import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { anon, runId, service } from "./helpers";
import {
  queryCategories,
  queryProductBySlug,
  queryPublishedProducts,
  querySettings,
} from "@/lib/queries";

type Seed = {
  catA: { id: string; slug: string };
  catB: { id: string; slug: string };
  older: { id: string; slug: string };
  newer: { id: string; slug: string };
  other: { id: string; slug: string };
  draft: { id: string; slug: string };
};

let s: Seed | undefined;

/** Yalnızca bu dosyanın ürünlerini döndürür (veritabanında başka ürünler de olabilir). */
const ours = <T extends { id: string }>(items: T[]) =>
  items.filter((p) => s && [s.older.id, s.newer.id, s.other.id, s.draft.id].includes(p.id));

beforeAll(async () => {
  const svc = service();
  const id = runId();
  const cat = async (name: string, sort: number) => {
    const r = await svc
      .from("categories")
      .insert({ name: `${name} ${id}`, slug: `${name.toLowerCase()}-${id}`, sort_order: sort })
      .select("id, slug")
      .single();
    if (r.error) throw r.error;
    return r.data;
  };
  const catA = await cat("A", -1000);
  const catB = await cat("B", -1000);

  const product = async (
    key: string,
    categoryId: string,
    status: "published" | "draft",
    publishedAt: string | null,
    imageOrders: number[],
  ) => {
    const r = await svc
      .from("products")
      .insert({
        title: `${key} ${id}`,
        slug: `${key}-${id}`,
        description: `${key} açıklama`,
        category_id: categoryId,
        status,
        published_at: publishedAt,
      })
      .select("id, slug")
      .single();
    if (r.error) throw r.error;
    if (imageOrders.length) {
      const imgs = await svc.from("product_images").insert(
        imageOrders.map((o) => ({
          product_id: r.data.id,
          path_thumb: `test/${id}/${key}-${o}-thumb.webp`,
          path_full: `test/${id}/${key}-${o}-full.webp`,
          width: 100,
          height: 100,
          sort_order: o,
        })),
      );
      if (imgs.error) throw imgs.error;
    }
    return r.data;
  };

  // Gelecek tarihler: veritabanındaki gerçek ürünlerin önüne geçer, sıralama testini netleştirir.
  const t = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();
  s = {
    catA,
    catB,
    // Fotoğraflar bilerek karışık sırayla eklenir.
    older: await product("older", catA.id, "published", t(3000), [2, 0, 1]),
    newer: await product("newer", catA.id, "published", t(3001), []),
    other: await product("other", catB.id, "published", t(2999), [0]),
    draft: await product("draft", catA.id, "draft", null, [0]),
  };
});

afterAll(async () => {
  if (!s) return;
  const svc = service();
  await svc.from("products").delete().in("category_id", [s.catA.id, s.catB.id]);
  await svc.from("categories").delete().in("id", [s.catA.id, s.catB.id]);
});

describe("queryPublishedProducts", () => {
  test("taslağı içermez ve published_at'e göre yeniden eskiye sıralar", async () => {
    const { items } = await queryPublishedProducts(anon(), { limit: 24 });
    expect(ours(items).map((p) => p.id)).toEqual([s!.newer.id, s!.older.id, s!.other.id]);
  });

  test("limit'ten fazla ürün varken hasMore true döner", async () => {
    const { items, hasMore } = await queryPublishedProducts(anon(), { limit: 1 });
    expect(items).toHaveLength(1);
    expect(hasMore).toBe(true);
  });

  test("categorySlug filtresi yalnızca o kategorinin ürünlerini döndürür", async () => {
    const { items, hasMore } = await queryPublishedProducts(anon(), { categorySlug: s!.catA.slug, limit: 24 });
    expect(items.map((p) => p.id)).toEqual([s!.newer.id, s!.older.id]);
    expect(items.every((p) => p.category.slug === s!.catA.slug)).toBe(true);
    expect(hasMore).toBe(false);
  });

  test("kapak sort_order'ı en küçük fotoğraftır; fotoğrafsız üründe null'dır", async () => {
    const { items } = await queryPublishedProducts(anon(), { categorySlug: s!.catA.slug, limit: 24 });
    const older = items.find((p) => p.id === s!.older.id)!;
    const newer = items.find((p) => p.id === s!.newer.id)!;
    expect(older.cover?.sort_order).toBe(0);
    expect(older.cover?.path_thumb).toContain("older-0-thumb");
    expect(newer.cover).toBeNull();
  });
});

describe("queryProductBySlug", () => {
  test("taslak ürün için null döner", async () => {
    expect(await queryProductBySlug(anon(), s!.draft.slug)).toBeNull();
  });

  test("olmayan slug için null döner", async () => {
    expect(await queryProductBySlug(anon(), `yok-${runId()}`)).toBeNull();
  });

  test("fotoğrafları sort_order sırasıyla döndürür, kapak ilk fotoğraftır", async () => {
    const p = await queryProductBySlug(anon(), s!.older.slug);
    expect(p).not.toBeNull();
    expect(p!.images.map((i) => i.sort_order)).toEqual([0, 1, 2]);
    expect(p!.cover).toEqual(p!.images[0]);
    expect(p!.description).toBe("older açıklama");
    expect(p!.category.slug).toBe(s!.catA.slug);
  });
});

describe("queryCategories", () => {
  test("sort_order, sonra name sırasıyla döner", async () => {
    const cats = await queryCategories(anon());
    const idx = (slug: string) => cats.findIndex((c) => c.slug === slug);
    expect(idx(s!.catA.slug)).toBeGreaterThanOrEqual(0);
    // Aynı sort_order (-1000) → isme göre: "A …" önce, "B …" sonra; ikisi de sort_order 0'lı kategorilerden önce.
    expect(idx(s!.catA.slug)).toBe(0);
    expect(idx(s!.catB.slug)).toBe(1);
    const sorts = cats.map((c) => c.sort_order);
    expect(sorts).toEqual([...sorts].sort((a, b) => a - b));
  });
});

describe("querySettings", () => {
  test("tek satırlık ayarları döndürür", async () => {
    const settings = await querySettings(anon());
    expect(typeof settings.tagline).toBe("string");
    expect(settings).toHaveProperty("whatsapp_number");
    expect(settings).toHaveProperty("instagram_username");
    expect(typeof settings.about_text).toBe("string");
  });
});

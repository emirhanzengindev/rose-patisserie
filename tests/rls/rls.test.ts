import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  anon,
  deleteUser,
  dropFixtures,
  makeFixtures,
  makeUser,
  runId,
  service,
  tinyWebp,
  type Fixtures,
} from "./helpers";

let f: Fixtures;
let admin: { id: string; client: SupabaseClient };
let user: { id: string; client: SupabaseClient };

beforeAll(async () => {
  f = await makeFixtures();
  admin = await makeUser(true);
  user = await makeUser(false);
});

afterAll(async () => {
  await dropFixtures(f);
  if (admin) await deleteUser(admin.id);
  if (user) await deleteUser(user.id);
});

describe("anon (ziyaretçi)", () => {
  test("taslak ürünü göremez", async () => {
    const { data, error } = await anon().from("products").select("id").eq("category_id", f.category.id);
    expect(error).toBeNull();
    expect(data!.map((r) => r.id)).toEqual([f.published.id]);
  });

  test("taslak ürünün fotoğrafını göremez", async () => {
    const { data } = await anon().from("product_images").select("product_id").eq("product_id", f.draft.id);
    expect(data).toEqual([]);
    const pub = await anon().from("product_images").select("product_id").eq("product_id", f.published.id);
    expect(pub.data).toHaveLength(1);
  });

  test("hiçbir tabloya yazamaz", async () => {
    const ins = await anon()
      .from("products")
      .insert({ title: "x", slug: `x-${runId()}`, category_id: f.category.id });
    expect(ins.error).not.toBeNull();
    const upd = await anon().from("site_settings").update({ tagline: "hack" }).eq("id", 1).select();
    expect(upd.data ?? []).toEqual([]);
    const settings = await service().from("site_settings").select("tagline").single();
    expect(settings.data!.tagline).not.toBe("hack");
  });

  test("admin listesini göremez", async () => {
    const { data } = await anon().from("admins").select("user_id");
    expect(data ?? []).toEqual([]);
  });
});

describe("giriş yapmış ama admin olmayan kullanıcı", () => {
  test("taslağı göremez ve ürün ekleyemez", async () => {
    const read = await user.client.from("products").select("id").eq("id", f.draft.id);
    expect(read.data).toEqual([]);
    const ins = await user.client
      .from("products")
      .insert({ title: "x", slug: `x-${runId()}`, category_id: f.category.id });
    expect(ins.error).not.toBeNull();
  });

  test("depolamaya dosya yükleyemez", async () => {
    const up = await user.client.storage.from("product-images").upload(`test/${runId()}.webp`, tinyWebp());
    expect(up.error).not.toBeNull();
  });

  test("kendini admin yapamaz", async () => {
    const ins = await user.client.from("admins").insert({ user_id: user.id });
    expect(ins.error).not.toBeNull();
  });
});

describe("admin", () => {
  test("taslağı görür, ürün ekler ve siler", async () => {
    const read = await admin.client.from("products").select("id").eq("id", f.draft.id);
    expect(read.data).toHaveLength(1);
    const ins = await admin.client
      .from("products")
      .insert({ title: "Admin ürünü", slug: `admin-${runId()}`, category_id: f.category.id })
      .select()
      .single();
    expect(ins.error).toBeNull();
    const del = await admin.client.from("products").delete().eq("id", ins.data!.id).select();
    expect(del.data).toHaveLength(1);
  });

  test("depolamaya yükler ve siler", async () => {
    const path = `test/${runId()}.webp`;
    const up = await admin.client.storage.from("product-images").upload(path, tinyWebp());
    expect(up.error).toBeNull();
    const rm = await admin.client.storage.from("product-images").remove([path]);
    expect(rm.error).toBeNull();
    expect(rm.data).toHaveLength(1);
  });

  test("ayarları günceller", async () => {
    const before = await service().from("site_settings").select("tagline").single();
    const upd = await admin.client.from("site_settings").update({ tagline: "Test" }).eq("id", 1).select();
    expect(upd.data).toHaveLength(1);
    await service().from("site_settings").update({ tagline: before.data!.tagline }).eq("id", 1);
  });

  test("ürünü olan kategori silinemez (23503)", async () => {
    const del = await admin.client.from("categories").delete().eq("id", f.category.id);
    expect(del.error?.code).toBe("23503");
  });
});

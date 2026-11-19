import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, ProductCard, ProductDetail, ProductImage, SiteSettings } from "./types";

// Sorgular istemciyi parametre olarak alır: uygulamada önbellekli `data.ts` sarar,
// testlerde doğrudan anon istemciyle çağrılır.

const IMAGE_COLS = "id, path_thumb, path_full, width, height, sort_order";
const CARD_COLS = `id, title, slug, published_at, category:categories!inner(name, slug), product_images(${IMAGE_COLS})`;

type CardRow = {
  id: string;
  title: string;
  slug: string;
  published_at: string;
  category: { name: string; slug: string };
  product_images: ProductImage[];
};

const toCard = ({ product_images, ...row }: CardRow): ProductCard => ({
  ...row,
  cover: product_images[0] ?? null,
});

function fail(what: string, error: { message: string }): never {
  throw new Error(`${what} okunamadı: ${error.message}`);
}

export async function queryPublishedProducts(
  client: SupabaseClient,
  opts: { categorySlug?: string; limit: number },
): Promise<{ items: ProductCard[]; hasMore: boolean }> {
  let q = client
    .from("products")
    .select(CARD_COLS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .order("sort_order", { referencedTable: "product_images" })
    .limit(1, { referencedTable: "product_images" })
    // hasMore için bir fazlası çekilir.
    .limit(opts.limit + 1);
  if (opts.categorySlug) q = q.eq("category.slug", opts.categorySlug);

  const { data, error } = await q.overrideTypes<CardRow[], { merge: false }>();
  if (error) fail("Ürünler", error);
  return {
    items: data.slice(0, opts.limit).map(toCard),
    hasMore: data.length > opts.limit,
  };
}

export async function queryProductBySlug(client: SupabaseClient, slug: string): Promise<ProductDetail | null> {
  const { data, error } = await client
    .from("products")
    .select(`${CARD_COLS}, description`)
    .eq("slug", slug)
    .eq("status", "published")
    .order("sort_order", { referencedTable: "product_images" })
    .maybeSingle()
    .overrideTypes<CardRow & { description: string }, { merge: false }>();
  if (error) fail("Ürün", error);
  if (!data) return null;
  return { ...toCard(data), description: data.description, images: data.product_images };
}

export async function queryCategories(client: SupabaseClient): Promise<Category[]> {
  const { data, error } = await client
    .from("categories")
    .select("id, name, slug, sort_order")
    .order("sort_order")
    .order("name");
  if (error) fail("Kategoriler", error);
  return data;
}

export async function querySettings(client: SupabaseClient): Promise<SiteSettings> {
  const { data, error } = await client
    .from("site_settings")
    .select("whatsapp_number, instagram_username, tagline, about_text")
    .eq("id", 1)
    .single();
  if (error) fail("Site ayarları", error);
  return data;
}

// --- Yönetim (oturumlu istemciyle; RLS admin'e taslakları da gösterir) ---

export type AdminProductRow = {
  id: string;
  title: string;
  slug: string;
  status: "published" | "draft";
  category: { name: string };
  cover: { path_thumb: string } | null;
};

export async function queryAdminProducts(client: SupabaseClient): Promise<AdminProductRow[]> {
  const { data, error } = await client
    .from("products")
    .select("id, title, slug, status, category:categories!inner(name), product_images(path_thumb)")
    .order("updated_at", { ascending: false })
    .order("sort_order", { referencedTable: "product_images" })
    .limit(1, { referencedTable: "product_images" })
    .limit(500)
    .overrideTypes<(Omit<AdminProductRow, "cover"> & { product_images: { path_thumb: string }[] })[], { merge: false }>();
  if (error) fail("Ürünler", error);
  return data.map(({ product_images, ...row }) => ({ ...row, cover: product_images[0] ?? null }));
}

export type AdminProductDetail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category_id: string;
  status: "published" | "draft";
  images: ProductImage[];
};

export async function queryAdminProduct(client: SupabaseClient, id: string): Promise<AdminProductDetail | null> {
  const { data, error } = await client
    .from("products")
    .select(`id, title, slug, description, category_id, status, product_images(${IMAGE_COLS})`)
    .eq("id", id)
    .order("sort_order", { referencedTable: "product_images" })
    .maybeSingle()
    .overrideTypes<Omit<AdminProductDetail, "images"> & { product_images: ProductImage[] }, { merge: false }>();
  if (error) fail("Ürün", error);
  if (!data) return null;
  const { product_images, ...row } = data;
  return { ...row, images: product_images };
}

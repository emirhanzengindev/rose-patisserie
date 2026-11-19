import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { TAGS } from "./cache-tags";
import { createPublicSupabase } from "./supabase/public";
import { queryCategories, queryProductBySlug, queryPublishedProducts, querySettings } from "./queries";
import type { Category, ProductCard, ProductDetail, SiteSettings } from "./types";

// Ziyaretçi verisi önbelleğe alınır; yönetimdeki her kayıt ilgili etiketi `updateTag` ile tazeler.
// `hours` yalnızca bir güvenlik ağıdır: asıl tazeleme etiketlerle olur.

export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.settings);
  return querySettings(createPublicSupabase());
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.categories);
  return queryCategories(createPublicSupabase());
}

export async function getPublishedProducts(opts: {
  categorySlug?: string;
  limit: number;
}): Promise<{ items: ProductCard[]; hasMore: boolean }> {
  "use cache";
  cacheLife("hours");
  // Kategori adı/adresi kartlarda göründüğü için kategori değişikliği de bu listeyi tazeler.
  cacheTag(TAGS.products, TAGS.categories);
  return queryPublishedProducts(createPublicSupabase(), opts);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.products, TAGS.categories);
  return queryProductBySlug(createPublicSupabase(), slug);
}

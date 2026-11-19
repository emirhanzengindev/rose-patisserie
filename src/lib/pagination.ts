export const PAGE_SIZE = 24;
export const MAX_LIMIT = 240;

/** `?adet=` değerini 24'ün katına yukarı yuvarlar; geçersizse 24, en fazla 240. */
export function parseLimit(raw: string | string[] | undefined): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isFinite(value) || value <= 0) return PAGE_SIZE;
  return Math.min(MAX_LIMIT, Math.ceil(value / PAGE_SIZE) * PAGE_SIZE);
}

/** Ana sayfa (katalog) adresi; varsayılan değerler adrese yazılmaz. */
export function catalogHref({ category, limit }: { category?: string; limit?: number }): string {
  const params = new URLSearchParams();
  if (category) params.set("kategori", category);
  if (limit && limit > PAGE_SIZE) params.set("adet", String(limit));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

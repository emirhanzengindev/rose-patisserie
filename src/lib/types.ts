export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type ProductImage = {
  id: string;
  path_thumb: string;
  path_full: string;
  width: number;
  height: number;
  sort_order: number;
};

export type ProductCard = {
  id: string;
  title: string;
  slug: string;
  published_at: string;
  category: { name: string; slug: string };
  cover: ProductImage | null;
};

export type ProductDetail = ProductCard & {
  description: string;
  images: ProductImage[];
};

/** Server Action sonucu; `error` kullanıcıya gösterilebilir Türkçe metindir. */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type SiteSettings = {
  whatsapp_number: string | null;
  instagram_username: string | null;
  tagline: string;
  about_text: string;
};

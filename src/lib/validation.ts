import * as z from "zod";
import type { ActionResult } from "./types";
import { normalizeTrPhone } from "./whatsapp";

export const MAX_IMAGES = 8;

// Yalnızca panelin ürettiği yollar: products/<parti>/<ad>-thumb|full.webp (Safari'de .jpg)
const IMAGE_PATH = /^products\/[A-Za-z0-9-]+\/[A-Za-z0-9-]+-(thumb|full)\.(webp|jpg)$/;

const imageSchema = z.object({
  path_thumb: z.string().regex(IMAGE_PATH, { error: "Geçersiz fotoğraf." }),
  path_full: z.string().regex(IMAGE_PATH, { error: "Geçersiz fotoğraf." }),
  width: z.int().positive().max(10000),
  height: z.int().positive().max(10000),
});

export const productSchema = z
  .object({
    id: z.uuid().optional(),
    title: z
      .string({ error: "Ürün adı gerekli." })
      .trim()
      .min(1, { error: "Ürün adı gerekli." })
      .max(120, { error: "Ürün adı en fazla 120 karakter olabilir." }),
    description: z
      .string()
      .trim()
      .max(5000, { error: "Açıklama en fazla 5000 karakter olabilir." })
      .default(""),
    categoryId: z.uuid({ error: "Kategori seçin." }),
    status: z.enum(["published", "draft"], { error: "Geçersiz durum." }),
    images: z.array(imageSchema).max(MAX_IMAGES, { error: `En fazla ${MAX_IMAGES} fotoğraf eklenebilir.` }),
  })
  .refine((p) => p.status === "draft" || p.images.length > 0, {
    error: "Yayınlamak için en az bir fotoğraf ekleyin.",
    path: ["images"],
  });

export type ImageInput = z.infer<typeof imageSchema>;
export type ProductInput = z.infer<typeof productSchema>;

/** Formdan gelen veriyi doğrular; hata mesajı kullanıcıya gösterilebilir Türkçe metindir. */
export function parseProductInput(input: unknown): ActionResult<ProductInput> {
  const result = productSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.issues[0]?.message ?? "Form geçersiz." };
}

// --- Kategoriler ---

export function parseCategoryName(input: unknown): ActionResult<string> {
  const result = z
    .string({ error: "Kategori adı gerekli." })
    .trim()
    .min(1, { error: "Kategori adı gerekli." })
    .max(60, { error: "Kategori adı en fazla 60 karakter olabilir." })
    .safeParse(input);
  return result.success ? { ok: true, data: result.data } : { ok: false, error: result.error.issues[0].message };
}

// --- Site ayarları ---

const PHONE_ERROR = "Geçerli bir cep telefonu numarası girin (ör. 0532 123 45 67).";
const INSTAGRAM_ERROR = "Geçerli bir Instagram kullanıcı adı girin (ör. rose.patisserie.tr).";

/** "@ad", "ad" ya da profil bağlantısından kullanıcı adını çıkarır. */
function instagramHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@/, "")
    .toLowerCase();
}

export const settingsSchema = z.object({
  whatsapp_number: z
    .string()
    .default("")
    .transform((raw, ctx) => {
      if (!raw.trim()) return null;
      const phone = normalizeTrPhone(raw);
      if (!phone) ctx.addIssue({ code: "custom", message: PHONE_ERROR });
      return phone;
    }),
  instagram_username: z
    .string()
    .default("")
    .transform((raw, ctx) => {
      const handle = instagramHandle(raw);
      if (!handle) return null;
      if (!/^[a-z0-9._]{1,30}$/.test(handle)) ctx.addIssue({ code: "custom", message: INSTAGRAM_ERROR });
      return handle;
    }),
  tagline: z
    .string({ error: "Karşılama cümlesi gerekli." })
    .trim()
    .min(1, { error: "Karşılama cümlesi gerekli." })
    .max(120, { error: "Karşılama cümlesi en fazla 120 karakter olabilir." }),
  about_text: z.string().trim().max(3000, { error: "Hakkında metni en fazla 3000 karakter olabilir." }).default(""),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export function parseSettingsInput(input: unknown): ActionResult<SettingsInput> {
  const result = settingsSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.issues[0]?.message ?? "Form geçersiz." };
}

import * as z from "zod";
import type { ActionResult } from "./types";

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

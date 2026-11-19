export const IMAGE_BUCKET = "product-images";

export function publicImageUrl(path: string, base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""): string {
  return `${base}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
}

/** Uzun kenarı `max`'ı aşmayacak şekilde boyutları küçültür; asla büyütmez. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export const FULL_MAX = 1600;
export const THUMB_MAX = 640;
const QUALITY = 0.82;

export type EncodedImage = { blob: Blob; width: number; height: number; ext: "webp" | "jpg" };

/** Telefon fotoğrafını açar; EXIF yönü uygulanır. Açılamazsa hata fırlatır. (Yalnızca tarayıcıda.) */
export function decodeImage(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Fotoğrafı uzun kenarı `max` olacak şekilde küçültüp WebP'ye çevirir. Canvas'a yeniden çizildiği için
 * konum gibi meta veriler taşınmaz. WebP üretemeyen tarayıcılarda (Safari) JPEG'e düşer. (Yalnızca tarayıcıda.)
 */
export async function resizeToWebp(source: Blob | ImageBitmap, max: number, quality = QUALITY): Promise<EncodedImage> {
  const bitmap = source instanceof Blob ? await decodeImage(source) : source;
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, max);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);

    const webp = await toBlob(canvas, "image/webp", quality);
    if (webp?.type === "image/webp") return { blob: webp, width, height, ext: "webp" };
    const jpeg = await toBlob(canvas, "image/jpeg", quality);
    if (!jpeg) throw new Error("encode");
    return { blob: jpeg, width, height, ext: "jpg" };
  } finally {
    if (source instanceof Blob) bitmap.close();
  }
}

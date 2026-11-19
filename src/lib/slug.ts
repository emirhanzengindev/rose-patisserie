const TR_MAP: Record<string, string> = {
  ş: "s", Ş: "s", ı: "i", İ: "i", ğ: "g", Ğ: "g",
  ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c",
};

/** Türkçe karakterleri ASCII'ye çevirip URL'ye uygun kısa ad üretir. */
export function slugify(input: string): string {
  const slug = input
    .replace(/[şŞıİğĞüÜöÖçÇ]/g, (ch) => TR_MAP[ch])
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "urun";
}

/** `taken` içinde olmayan ilk `base`, `base-2`, `base-3`… değerini döner. */
export function uniqueSlug(base: string, taken: string[]): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}

/** Türkiye cep numarasını `905XXXXXXXXX` biçimine getirir; geçersizse null. */
export function normalizeTrPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = `9${digits}`;
  else if (digits.length === 10 && digits.startsWith("5")) digits = `90${digits}`;
  return digits.length === 12 && digits.startsWith("905") ? digits : null;
}

/** Ürün adıyla hazır yazılmış WhatsApp sohbet bağlantısı. */
export function whatsappLink(phone: string, productTitle?: string, productUrl?: string): string {
  const text = productTitle
    ? `Merhaba, *${productTitle}* hakkında bilgi almak istiyorum.${productUrl ? `\n${productUrl}` : ""}`
    : "Merhaba, bilgi almak istiyorum.";
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function instagramUrl(username: string): string {
  return `https://www.instagram.com/${username.replace(/^@/, "")}/`;
}

/** `905321234567` → `0532 123 45 67` (formda gösterim için). Beklenmeyen değer olduğu gibi döner. */
export function formatTrPhone(phone: string | null): string {
  if (!phone) return "";
  const m = /^90(5\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  return m ? `0${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}

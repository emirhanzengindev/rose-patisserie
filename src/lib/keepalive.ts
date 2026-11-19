import { createHash, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

// Ücretsiz Supabase projesi 7 gün sorgu almazsa duraklatılır; ziyaretçi sayfaları önbellekten geldiği için
// bu olabilir. Vercel Cron günde bir kez bu işlevi çağırır ve veritabanına hafif bir sorgu atar.

const MIN_SECRET_LENGTH = 16;

/** Sabit sürede karşılaştırma (anahtar zamanlamayla tahmin edilemesin). */
function sameSecret(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function keepalive(
  authHeader: string | null,
  secret: string | undefined,
  client: SupabaseClient,
): Promise<{ status: number; body: { ok: boolean } }> {
  // Sunucuda anahtar yoksa ya da çok kısaysa uç nokta kapalıdır (yanlış yapılandırma herkese açmasın).
  if (!secret || secret.length < MIN_SECRET_LENGTH || !authHeader?.startsWith("Bearer ")) {
    return { status: 401, body: { ok: false } };
  }
  if (!sameSecret(authHeader.slice("Bearer ".length), secret)) return { status: 401, body: { ok: false } };

  const { error } = await client.from("site_settings").select("id").limit(1);
  if (error) {
    console.error("keepalive sorgusu başarısız:", error.message);
    return { status: 502, body: { ok: false } };
  }
  return { status: 200, body: { ok: true } };
}

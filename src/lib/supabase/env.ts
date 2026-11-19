/** Herkese açık Supabase ayarları. `NEXT_PUBLIC_` değişkenleri derlemede gömülür, bu yüzden doğrudan okunur. */
export function supabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY gerekli.");
  return { url, anonKey };
}

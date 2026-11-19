import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Service role istemcisi: RLS'i atlar. Yalnızca sunucu tarafında ve betiklerde kullanılır. */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

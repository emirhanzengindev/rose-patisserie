import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/** Cookie'siz anon istemci: önbelleğe alınan ziyaretçi sorguları için. RLS yalnızca yayındaki içeriği açar. */
export function createPublicSupabase(): SupabaseClient {
  const { url, anonKey } = supabaseEnv();
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

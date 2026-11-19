import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/** Tarayıcı istemcisi: yönetim panelinde fotoğrafları doğrudan Storage'a yüklemek için. */
export function createBrowserSupabase(): SupabaseClient {
  const { url, anonKey } = supabaseEnv();
  return createBrowserClient(url, anonKey);
}

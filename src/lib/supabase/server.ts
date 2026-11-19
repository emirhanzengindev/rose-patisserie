import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

/** Oturum cookie'leriyle çalışan istemci: yönetim sayfaları, Server Action'lar ve Route Handler'lar için. */
export async function createServerSupabase(): Promise<SupabaseClient> {
  const { url, anonKey } = supabaseEnv();
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Component'ten çağrıldığında cookie yazılamaz; oturumu proxy tazeler.
        }
      },
    },
  });
}

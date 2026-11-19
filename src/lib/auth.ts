import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { ADMIN_LOGIN_PATH } from "./admin-paths";
import { createServerSupabase } from "./supabase/server";

/**
 * Yönetim sayfaları için oturumlu istemci. Oturum yoksa ya da kullanıcı admin değilse girişe yönlendirir.
 * İstek başına bir kez çalışır (layout ve sayfa aynı sonucu paylaşır). <Suspense> içinde çağrılmalı.
 */
export const requireAdmin = cache(async (): Promise<SupabaseClient> => {
  // Panel her zaman istek anında üretilir; önceden yükleme (prefetch) sırasında oturumla ön işlenmez.
  await connection();
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect(ADMIN_LOGIN_PATH);

  // admins tablosunda RLS yalnızca kullanıcının kendi satırını gösterir.
  const { data: rows, error } = await supabase.from("admins").select("user_id").limit(1);
  // Ağ/sunucu hatası "admin değil" sayılmaz: kullanıcı oturumdan atılmaz, hata sayfası gösterilir.
  if (error) throw new Error(`Yetki kontrolü yapılamadı: ${error.message}`);
  if (!rows.length) redirect(`${ADMIN_LOGIN_PATH}?hata=yetki`);
  return supabase;
});

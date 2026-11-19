import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_LOGIN_PATH, requiresAdminLogin } from "@/lib/admin-paths";
import { supabaseEnv } from "@/lib/supabase/env";

// Yalnızca yönetim yollarında çalışır: oturumu tazeler, girişsiz kullanıcıyı giriş sayfasına yollar.
// Bu iyimser bir kontroldür; asıl yetki kararı RLS'tedir (`private.is_admin()`).
export async function proxy(request: NextRequest) {
  const { url, anonKey } = supabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  // getClaims oturumu doğrular ve gerekirse tazeler; arada başka kod çalıştırma.
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && requiresAdminLogin(request.nextUrl.pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = ADMIN_LOGIN_PATH;
    target.search = "";
    const redirect = NextResponse.redirect(target);
    // Tazeleme sırasında yazılan (ya da silinen) cookie'ler yönlendirmede de taşınmalı.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/yonetim/:path*"],
};

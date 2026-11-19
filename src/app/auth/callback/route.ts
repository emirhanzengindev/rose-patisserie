import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_LOGIN_PATH, safeNextPath } from "@/lib/admin-paths";
import { createServerSupabase } from "@/lib/supabase/server";

// E-posta bağlantısı (şifre yenileme) buraya döner: kodu oturuma çevirir, `next` iç yoluna yönlendirir.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL(`${ADMIN_LOGIN_PATH}?hata=baglanti`, request.url));
}

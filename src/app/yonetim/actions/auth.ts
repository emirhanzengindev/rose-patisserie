"use server";

import { redirect } from "next/navigation";
import { ADMIN_HOME_PATH, ADMIN_LOGIN_PATH, safeNextPath } from "@/lib/admin-paths";
import { isAdmin } from "@/lib/product-service";
import { absoluteUrl } from "@/lib/site";
import { createServerSupabase } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string };

const MIN_PASSWORD = 8;
const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");

function rateLimited(error: { status?: number; code?: string }) {
  return error.status === 429 || error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit";
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = field(formData, "email").trim();
  const password = field(formData, "password");
  if (!email || !password) return { error: "E-posta ve şifre gerekli." };

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (rateLimited(error)) return { error: "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin." };
    return { error: "E-posta ya da şifre hatalı." };
  }
  if (!(await isAdmin(supabase))) {
    await supabase.auth.signOut({ scope: "local" });
    return { error: "Bu hesabın yönetim paneline erişimi yok." };
  }
  redirect(safeNextPath(field(formData, "next") || ADMIN_HOME_PATH));
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabase();
  // Yalnızca bu cihazdaki oturum kapanır; telefondaki oturum etkilenmez.
  await supabase.auth.signOut({ scope: "local" });
  redirect(ADMIN_LOGIN_PATH);
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = field(formData, "email").trim();
  if (!email) return { error: "E-posta adresinizi yazın." };

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: absoluteUrl("/auth/callback?next=/yonetim/sifre-yenile"),
  });
  if (error && rateLimited(error)) return { error: "Çok fazla istek gönderildi. Birkaç dakika sonra tekrar deneyin." };
  // Hesabın var olup olmadığı açığa çıkmasın diye sonuç her durumda aynı.
  return {
    message: "Bu e-posta kayıtlıysa şifre yenileme bağlantısı gönderildi. Bağlantıyı bu cihazda, bu tarayıcıda açın.",
  };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = field(formData, "password");
  const confirm = field(formData, "confirm");
  if (password.length < MIN_PASSWORD) return { error: `Şifre en az ${MIN_PASSWORD} karakter olmalı.` };
  if (password !== confirm) return { error: "Şifreler aynı değil." };

  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: "Bağlantının süresi dolmuş. Giriş sayfasından yeniden şifre yenileme isteyin." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { error: "Yeni şifre eskisinden farklı olmalı." };
    if (error.code === "weak_password") return { error: "Bu şifre çok zayıf; daha uzun ya da karışık bir şifre seçin." };
    return { error: "Şifre değiştirilemedi, lütfen tekrar deneyin." };
  }
  redirect(ADMIN_HOME_PATH);
}

"use client";

import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { requestPasswordReset, signIn, updatePassword, type FormState } from "@/app/yonetim/actions/auth";

const URL_ERRORS: Record<string, string> = {
  yetki: "Bu hesabın yönetim paneline erişimi yok.",
  baglanti: "Bağlantı geçersiz ya da süresi dolmuş. Yeniden şifre yenileme isteyin.",
};

const inputClass = "min-h-12 rounded-2xl bg-surface px-4 text-base shadow-[var(--shadow-soft)]";
const buttonClass =
  "pressable min-h-12 rounded-full bg-accent px-6 font-semibold text-accent-text disabled:opacity-60";

function Alert({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-[0.9375rem] font-medium text-danger">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p role="status" className="rounded-2xl bg-surface px-4 py-3 text-[0.9375rem] shadow-[var(--shadow-soft)]">
        {state.message}
      </p>
    );
  return null;
}

export function LoginForm() {
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [loginState, loginAction, loginPending] = useActionState(signIn, {
    error: URL_ERRORS[params.get("hata") ?? ""],
  });
  const [resetState, resetAction, resetPending] = useActionState(requestPasswordReset, {});

  if (mode === "reset") {
    return (
      <form action={resetAction} className="flex flex-col gap-4">
        <p className="text-text-muted">E-posta adresinizi yazın, şifre yenileme bağlantısı gönderelim.</p>
        <Alert state={resetState} />
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.9375rem] font-semibold">E-posta</span>
          <input name="email" type="email" autoComplete="email" inputMode="email" required className={inputClass} />
        </label>
        <button type="submit" disabled={resetPending} className={buttonClass}>
          {resetPending ? "Gönderiliyor…" : "Bağlantı gönder"}
        </button>
        <button type="button" onClick={() => setMode("login")} className="min-h-11 text-[0.9375rem] text-text-muted">
          Girişe dön
        </button>
      </form>
    );
  }

  return (
    <form action={loginAction} className="flex flex-col gap-4">
      <Alert state={loginState} />
      <input type="hidden" name="next" value={params.get("next") ?? ""} />
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.9375rem] font-semibold">E-posta</span>
        <input name="email" type="email" autoComplete="username" inputMode="email" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.9375rem] font-semibold">Şifre</span>
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </label>
      <button type="submit" disabled={loginPending} className={buttonClass}>
        {loginPending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
      <button type="button" onClick={() => setMode("reset")} className="min-h-11 text-[0.9375rem] text-accent">
        Şifremi unuttum
      </button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Alert state={state} />
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.9375rem] font-semibold">Yeni şifre</span>
        <input name="password" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.9375rem] font-semibold">Yeni şifre (tekrar)</span>
        <input name="confirm" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
      </label>
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Kaydediliyor…" : "Şifreyi kaydet"}
      </button>
    </form>
  );
}

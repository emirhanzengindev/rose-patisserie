import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/admin/auth-forms";
import { AuthShell } from "@/components/admin/auth-shell";

export const metadata: Metadata = { title: "Şifre yenile" };

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Yeni şifre">
      <NewPasswordForm />
    </AuthShell>
  );
}

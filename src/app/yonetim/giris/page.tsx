import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/auth-forms";
import { AuthShell } from "@/components/admin/auth-shell";

export const metadata: Metadata = { title: "Giriş" };

export default function LoginPage() {
  return (
    <AuthShell title="Panele giriş">
      {/* Form adres parametrelerini (hata, next) okur. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}

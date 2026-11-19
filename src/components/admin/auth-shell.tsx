import Link from "next/link";
import type { ReactNode } from "react";

/** Giriş ve şifre sayfalarının ortak çerçevesi. */
export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <Link href="/" className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
        Rose <span className="text-accent">Patisserie</span>
      </Link>
      <h1 className="display mt-6 mb-6 text-[2rem]">{title}</h1>
      {children}
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Pressable } from "@/components/pressable";

export const metadata: Metadata = { title: "Sayfa bulunamadı" };

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="text-5xl text-gold" aria-hidden="true">
        ✿
      </p>
      <h1 className="display mt-4 text-[2rem]">Bu sayfa bulunamadı</h1>
      <p className="mt-3 text-text-muted">Aradığın ürün kaldırılmış ya da adresi değişmiş olabilir.</p>
      <Pressable
        as={Link}
        href="/"
        className="mt-8 rounded-full bg-accent px-6 py-3 font-semibold text-accent-text"
      >
        Ürünlere dön
      </Pressable>
    </main>
  );
}

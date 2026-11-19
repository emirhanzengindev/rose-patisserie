import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth";
import { queryCategories } from "@/lib/queries";

export const metadata: Metadata = { title: "Yeni ürün" };

export default async function NewProductPage() {
  const categories = await queryCategories(await requireAdmin());

  if (categories.length === 0) {
    return (
      <main className="pt-4">
        <h1 className="display text-[2rem]">Yeni ürün</h1>
        <p className="mt-4 text-text-muted">Ürün eklemeden önce en az bir kategori oluşturun (ör. Cheesecake, Cupcake).</p>
        <Link
          href="/yonetim/kategoriler"
          className="pressable mt-6 inline-flex min-h-12 items-center rounded-full bg-accent px-6 font-semibold text-accent-text"
        >
          Kategori ekle
        </Link>
      </main>
    );
  }

  return (
    <main>
      <ProductForm categories={categories} />
    </main>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth";
import { queryAdminProduct, queryCategories } from "@/lib/queries";

export const metadata: Metadata = { title: "Ürünü düzenle" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await requireAdmin();
  const [product, categories] = await Promise.all([queryAdminProduct(supabase, id), queryCategories(supabase)]);
  if (!product) notFound();

  return (
    <main>
      {/* key: başka ürüne geçildiğinde form durumu sıfırlansın. */}
      <ProductForm key={product.id} categories={categories} product={product} />
    </main>
  );
}

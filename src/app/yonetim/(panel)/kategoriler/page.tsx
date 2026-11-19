import type { Metadata } from "next";
import { CategoryList } from "@/components/admin/category-list";
import { requireAdmin } from "@/lib/auth";
import { queryAdminCategories } from "@/lib/queries";

export const metadata: Metadata = { title: "Kategoriler" };

export default async function CategoriesPage() {
  const categories = await queryAdminCategories(await requireAdmin());
  return (
    <main className="pt-4">
      <h1 className="display text-[2rem]">Kategoriler</h1>
      <p className="mt-2 text-text-muted">Sitede ürünlerin üstündeki düğmeler bu sırayla görünür. Ada dokunarak değiştirebilirsiniz.</p>
      <CategoryList categories={categories} />
    </main>
  );
}

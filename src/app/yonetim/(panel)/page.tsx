import type { Metadata } from "next";
import Link from "next/link";
import { Pressable } from "@/components/pressable";
import { requireAdmin } from "@/lib/auth";
import { queryAdminProducts } from "@/lib/queries";
import { publicImageUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Ürünler" };

const NOTICES: Record<string, string> = {
  kaydedildi: "Kaydedildi. Değişiklik sitede birkaç saniye içinde görünür.",
  silindi: "Ürün silindi.",
};

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await requireAdmin();
  const [products, { durum }] = await Promise.all([queryAdminProducts(supabase), searchParams]);
  const notice = typeof durum === "string" ? NOTICES[durum] : undefined;

  return (
    <main className="pt-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="display text-[2rem]">Ürünler</h1>
        <Pressable
          as={Link}
          href="/yonetim/urun/yeni"
          className="flex min-h-11 items-center gap-1 rounded-full bg-accent px-4 font-semibold text-accent-text"
        >
          <span aria-hidden="true" className="text-xl leading-none">+</span> Yeni ürün
        </Pressable>
      </div>

      {notice && (
        <p role="status" className="mt-4 rounded-2xl bg-surface px-4 py-3 text-[0.9375rem] shadow-[var(--shadow-soft)]">
          ✓ {notice}
        </p>
      )}

      {products.length === 0 ? (
        <p className="mt-16 text-center text-text-muted">
          Henüz ürün yok. İlk ürünü eklemek için <span className="font-semibold text-text">Yeni ürün</span>’e dokunun.
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-2">
          {products.map((p) => (
            <li key={p.id}>
              <Pressable
                as={Link}
                href={`/yonetim/urun/${p.id}`}
                className="flex items-center gap-3 rounded-2xl bg-surface p-2 pr-4 shadow-[var(--shadow-soft)]"
              >
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-bg text-2xl text-gold">
                  {p.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={publicImageUrl(p.cover.path_thumb)} alt="" loading="lazy" className="size-full object-cover" />
                  ) : (
                    <span aria-hidden="true">✿</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.title}</p>
                  <p className="caption text-text-muted">{p.category.name}</p>
                </div>
                <span
                  className={`caption shrink-0 rounded-full px-2.5 py-1 font-semibold ${
                    p.status === "published" ? "bg-accent/15 text-accent" : "bg-text-muted/15 text-text-muted"
                  }`}
                >
                  {p.status === "published" ? "Yayında" : "Taslak"}
                </span>
              </Pressable>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

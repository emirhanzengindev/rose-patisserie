import Link from "next/link";
import { Suspense } from "react";
import { CategoryChips } from "@/components/category-chips";
import { Pressable } from "@/components/pressable";
import { ProductGrid, ProductGridSkeleton } from "@/components/product-grid";
import { getCategories, getPublishedProducts, getSettings } from "@/lib/data";
import { MAX_LIMIT, PAGE_SIZE, catalogHref, parseLimit } from "@/lib/pagination";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4">
      <Hero />
      <h2 className="sr-only">Ürünler</h2>
      {/* Adres parametreleri istek anında okunur; karşılama alanı statik kabukta kalır. */}
      <Suspense fallback={<CatalogFallback />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Hero() {
  const { tagline } = await getSettings();
  return (
    <section className="pt-10 pb-7 sm:pt-16 sm:pb-10">
      <h1 className="display">
        Rose <span className="text-accent">Patisserie</span>
      </h1>
      <p className="mt-3 max-w-md text-lg text-text-muted">{tagline}</p>
    </section>
  );
}

async function Catalog({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const params = await searchParams;
  const category = typeof params.kategori === "string" && params.kategori ? params.kategori : undefined;
  const limit = parseLimit(params.adet);

  const [categories, { items, hasMore }] = await Promise.all([
    getCategories(),
    getPublishedProducts({ categorySlug: category, limit }),
  ]);

  return (
    <>
      <CategoryChips categories={categories} active={category} />
      <div className="mt-5">
        <ProductGrid products={items} />
      </div>
      {hasMore && limit < MAX_LIMIT && (
        <div className="mt-10 flex justify-center">
          <Pressable
            as={Link}
            href={catalogHref({ category, limit: limit + PAGE_SIZE })}
            scroll={false}
            className="rounded-full bg-surface px-6 py-3 font-semibold shadow-[var(--shadow-soft)]"
          >
            Daha fazla göster
          </Pressable>
        </div>
      )}
    </>
  );
}

function CatalogFallback() {
  return (
    <>
      <div aria-hidden="true" className="flex gap-2 pb-1">
        {[56, 88, 72, 96].map((w) => (
          <div key={w} style={{ width: w }} className="h-9 rounded-full bg-surface" />
        ))}
      </div>
      <div className="mt-5">
        <ProductGridSkeleton />
      </div>
    </>
  );
}

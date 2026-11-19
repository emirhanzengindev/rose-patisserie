import { ProductCard } from "@/components/product-card";
import type { ProductCard as ProductCardData } from "@/lib/types";

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return (
      <p className="py-20 text-center text-lg text-text-muted">Yakında yeni lezzetler burada.</p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}

/** Ürünler yüklenirken ızgaranın yerini tutar; yerleşim kaymaz. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul aria-hidden="true" className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <div className="aspect-square rounded-2xl bg-surface motion-safe:animate-pulse" />
          <div className="mt-2.5 h-4 w-3/4 rounded bg-surface" />
          <div className="mt-1.5 h-3 w-1/2 rounded bg-surface" />
        </li>
      ))}
    </ul>
  );
}

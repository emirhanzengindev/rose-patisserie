import Link from "next/link";
import { ViewTransition } from "react";
import { Pressable } from "@/components/pressable";
import { formatDateTr } from "@/lib/format";
import { fitWithin } from "@/lib/image";
import { publicImageUrl } from "@/lib/storage";
import type { ProductCard as ProductCardData } from "@/lib/types";

const THUMB_MAX = 640;

export const coverTransitionName = (slug: string) => `cover-${slug}`;

export function ProductCard({ product }: { product: ProductCardData }) {
  const { cover } = product;
  const size = cover ? fitWithin(cover.width, cover.height, THUMB_MAX) : null;

  return (
    <Pressable as={Link} href={`/urun/${product.slug}`} className="group block rounded-2xl">
      <div className="aspect-square overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-soft)]">
        {cover && size ? (
          // Ürün sayfasındaki galerinin ilk fotoğrafıyla aynı ad: kapak yerinden büyüyerek geçer.
          <ViewTransition name={coverTransitionName(product.slug)} share="morph" default="none">
            {/* Fotoğraflar yüklenirken zaten küçültülüp WebP yapılıyor; next/image optimizasyonu gerekmez. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={publicImageUrl(cover.path_thumb)}
              alt={product.title}
              width={size.width}
              height={size.height}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </ViewTransition>
        ) : (
          <div
            data-testid="cover-placeholder"
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center text-4xl text-gold"
          >
            ✿
          </div>
        )}
      </div>
      <div className="px-1 pt-2.5 pb-1">
        <h3 className="line-clamp-2 text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em]">
          {product.title}
        </h3>
        <p className="caption mt-0.5 text-text-muted">
          {product.category.name} · <time dateTime={product.published_at}>{formatDateTr(product.published_at)}</time>
        </p>
      </div>
    </Pressable>
  );
}

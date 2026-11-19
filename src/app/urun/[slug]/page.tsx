import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactButtons } from "@/components/contact-buttons";
import { Gallery } from "@/components/gallery";
import { coverTransitionName } from "@/components/product-card";
import { getProductBySlug, getPublishedProducts, getSettings } from "@/lib/data";
import { formatDateTr } from "@/lib/format";
import { catalogHref } from "@/lib/pagination";
import { absoluteUrl } from "@/lib/site";
import { publicImageUrl } from "@/lib/storage";

// Cache Components boş liste kabul etmez: hiç ürün yoksa 404 veren bir yer tutucu adres döner.
// Listede olmayan (yeni) ürünlerin sayfaları ilk ziyarette üretilip saklanır.
const PLACEHOLDER_SLUG = "__ornek__";

// Sayfa içeriği <Suspense> arkasına alınmaz: kapak fotoğrafının karttan büyüyerek gelmesi (ViewTransition)
// içeriğin gezinmeyle aynı anda gelmesini gerektirir. Ürün sayfaları önceden üretilip önbellekten
// geldiği için pratikte gecikme olmaz; bu yüzden "anında gezinme" doğrulaması bu sayfada kapalı.
export const instant = false;

export async function generateStaticParams() {
  const { items } = await getPublishedProducts({ limit: 48 });
  return items.length ? items.map((p) => ({ slug: p.slug })) : [{ slug: PLACEHOLDER_SLUG }];
}

export async function generateMetadata({ params }: PageProps<"/urun/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Ürün bulunamadı" };

  const description = (product.description.trim() || `${product.category.name} · Rose Patisserie`)
    .replace(/\s+/g, " ")
    .slice(0, 160);
  const url = absoluteUrl(`/urun/${product.slug}`);

  return {
    title: product.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: product.title,
      description,
      siteName: "Rose Patisserie",
      locale: "tr_TR",
      images: product.cover
        ? [
            {
              url: publicImageUrl(product.cover.path_full),
              width: product.cover.width,
              height: product.cover.height,
              alt: product.title,
            },
          ]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/urun/[slug]">) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pt-4 sm:pt-8">
      <Link
        href="/"
        className="caption inline-flex min-h-11 items-center gap-1 text-text-muted hover:text-text"
      >
        <span aria-hidden="true">‹</span> Ürünler
      </Link>

      <div className="mt-2 grid gap-8 md:grid-cols-2 md:gap-10">
        <Gallery images={product.images} title={product.title} transitionName={coverTransitionName(product.slug)} />

        <article className="md:pt-2">
          <h1 className="display">{product.title}</h1>
          <p className="caption mt-3 text-text-muted">
            <Link href={catalogHref({ category: product.category.slug })} className="hover:text-text">
              {product.category.name}
            </Link>{" "}
            · <time dateTime={product.published_at}>{formatDateTr(product.published_at)}</time>
          </p>

          {product.description.trim() && (
            <div className="mt-6 text-[1.0625rem] leading-relaxed whitespace-pre-line">{product.description}</div>
          )}

          <p className="mt-8 font-semibold text-gold">Fiyat için yazın</p>
          <div className="mt-3">
            <ContactButtons
              settings={settings}
              productTitle={product.title}
              productUrl={absoluteUrl(`/urun/${product.slug}`)}
            />
          </div>
        </article>
      </div>
    </main>
  );
}

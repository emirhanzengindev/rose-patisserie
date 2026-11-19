"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState, useTransition } from "react";
import { deleteProduct, saveProduct } from "@/app/yonetim/actions/products";
import { ImagePicker, useImageUploads } from "@/components/admin/image-picker";
import type { AdminProductDetail } from "@/lib/queries";
import type { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  product?: AdminProductDetail;
};

/**
 * Next.js (Cache Components) ayrılan sayfaları <Activity> ile gizleyip durumunu saklar. Ürün formu için bu
 * istenmez: çıkışta kaydedilmemiş yüklemeler silinir, geri dönüldüğünde form güncel veriyle sıfırdan açılmalı.
 */
export function ProductForm(props: Props) {
  const [generation, setGeneration] = useState(0);
  useLayoutEffect(() => () => setGeneration((g) => g + 1), []);
  return <ProductFormInner key={generation} {...props} />;
}

function ProductFormInner({ categories, product }: Props) {
  const router = useRouter();
  const uploads = useImageUploads(product?.images ?? []);
  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [published, setPublished] = useState(product ? product.status === "published" : true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  const changed = dirty || uploads.hasFresh;

  // Kaydedilmemiş değişiklikle sekmeyi kapatırken uyar.
  useEffect(() => {
    if (!changed) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [changed]);

  const blockedReason = uploads.busy
    ? "Fotoğraflar yükleniyor…"
    : uploads.hasErrors
      ? "Yüklenemeyen fotoğrafları kaldırın."
      : null;

  function save() {
    if (blockedReason) return setError(blockedReason);
    setError(null);
    const images = uploads.images.flatMap((i) => (i.data ? [i.data] : []));
    startTransition(async () => {
      const result = await saveProduct({
        id: product?.id,
        title,
        description,
        categoryId,
        status: published ? "published" : "draft",
        images,
      });
      if (!result.ok) {
        // Yüklenen fotoğraflar silinmez: kullanıcı hatayı düzeltip yeniden kaydedebilir.
        setError(result.error);
        return;
      }
      uploads.markSaved();
      setDirty(false);
      router.push("/yonetim?durum=kaydedildi");
    });
  }

  function remove() {
    if (!product || !window.confirm(`“${product.title}” silinsin mi? Bu işlem geri alınamaz.`)) return;
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (!result.ok) return setError(result.error);
      router.push("/yonetim?durum=silindi");
    });
  }

  const edit = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="pb-10"
    >
      {/* Kaydet üstte durur: telefonda klavye açıkken de görünür kalır. */}
      <div className="glass sticky top-0 z-30 -mx-4 flex h-14 items-center justify-between gap-2 px-4">
        <Link href="/yonetim" className="caption flex min-h-11 items-center text-[0.9375rem] text-text-muted">
          Vazgeç
        </Link>
        <h1 className="truncate text-[1.0625rem] font-semibold">{product ? "Ürünü düzenle" : "Yeni ürün"}</h1>
        <button
          type="submit"
          disabled={pending || uploads.busy}
          className="pressable min-h-11 rounded-full bg-accent px-5 font-semibold text-accent-text disabled:opacity-50"
        >
          {pending ? "Kaydediliyor…" : uploads.busy ? "Yükleniyor…" : "Kaydet"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-2xl bg-danger/10 px-4 py-3 text-[0.9375rem] font-medium text-danger">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-6">
        <ImagePicker uploads={uploads} />

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.9375rem] font-semibold">Ürün adı</span>
          <input
            value={title}
            onChange={(e) => edit(setTitle)(e.target.value)}
            maxLength={120}
            required
            autoComplete="off"
            enterKeyHint="next"
            className="min-h-12 rounded-2xl bg-surface px-4 text-base shadow-[var(--shadow-soft)]"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.9375rem] font-semibold">Kategori</span>
          <select
            value={categoryId}
            onChange={(e) => edit(setCategoryId)(e.target.value)}
            required
            className="min-h-12 rounded-2xl bg-surface px-4 text-base shadow-[var(--shadow-soft)]"
          >
            <option value="" disabled>
              Kategori seçin
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.9375rem] font-semibold">
            Açıklama <span className="font-normal text-text-muted">(isteğe bağlı)</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => edit(setDescription)(e.target.value)}
            maxLength={5000}
            rows={6}
            className="rounded-2xl bg-surface px-4 py-3 text-base leading-relaxed shadow-[var(--shadow-soft)]"
          />
        </label>

        <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-soft)]">
          <div>
            <p id="published-label" className="text-[0.9375rem] font-semibold">
              Sitede yayında
            </p>
            <p className="caption text-text-muted">
              {published ? "Ziyaretçiler bu ürünü görür." : "Taslak: yalnızca panelde görünür."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={published}
            aria-labelledby="published-label"
            onClick={() => edit(setPublished)(!published)}
            className={`relative h-8 w-13 shrink-0 rounded-full transition-colors duration-200 ${published ? "bg-accent" : "bg-text-muted/30"}`}
          >
            <span
              className={`absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform duration-200 ease-out motion-reduce:transition-none ${
                published ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        {product && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="pressable mt-4 min-h-12 rounded-2xl font-semibold text-danger disabled:opacity-50"
          >
            Ürünü sil
          </button>
        )}
      </div>
    </form>
  );
}

"use client";

import { Reorder, useDragControls } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { FULL_MAX, THUMB_MAX, decodeImage, resizeToWebp } from "@/lib/image";
import { IMAGE_BUCKET, publicImageUrl } from "@/lib/storage";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { ProductImage } from "@/lib/types";
import { MAX_IMAGES, type ImageInput } from "@/lib/validation";

export type PickerImage = {
  key: string;
  previewUrl: string;
  status: "processing" | "uploading" | "ready" | "error";
  error?: string;
  data?: ImageInput;
  /** Bu oturumda yüklendi, henüz bir ürüne kaydedilmedi. */
  fresh: boolean;
};

const DECODE_ERROR = "Bu fotoğraf açılamadı, başka bir fotoğraf deneyin.";
const UPLOAD_ERROR = "Yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.";

/**
 * Fotoğrafları tarayıcıda küçültüp doğrudan Storage'a yükler. Kaydedilmeden bırakılan yüklemeler
 * (kaldırılan fotoğraf, sayfadan çıkış) silinir; böylece depoda sahipsiz dosya birikmez.
 */
export function useImageUploads(initial: ProductImage[]) {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [images, setImages] = useState<PickerImage[]>(() =>
    initial.map((img) => ({
      key: img.id,
      previewUrl: publicImageUrl(img.path_thumb),
      status: "ready",
      fresh: false,
      data: { path_thumb: img.path_thumb, path_full: img.path_full, width: img.width, height: img.height },
    })),
  );
  const keys = useRef(new Set(images.map((i) => i.key)));
  const freshPaths = useRef(new Set<string>());
  const objectUrls = useRef(new Set<string>());
  const batchId = useRef<string | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const token = useRef<string | null>(null);

  useEffect(() => {
    keys.current = new Set(images.map((i) => i.key));
  }, [images]);

  const update = useCallback(
    (key: string, patch: Partial<PickerImage>) =>
      setImages((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i))),
    [],
  );

  const removeFiles = useCallback(
    async (paths: string[]) => {
      if (!paths.length) return;
      paths.forEach((p) => freshPaths.current.delete(p));
      await supabase.storage.from(IMAGE_BUCKET).remove(paths);
    },
    [supabase],
  );

  const processOne = useCallback(
    async (key: string, file: File) => {
      let full, thumb;
      try {
        const bitmap = await decodeImage(file);
        try {
          full = await resizeToWebp(bitmap, FULL_MAX);
          thumb = await resizeToWebp(bitmap, THUMB_MAX);
        } finally {
          bitmap.close();
        }
      } catch {
        update(key, { status: "error", error: DECODE_ERROR });
        return;
      }
      if (!keys.current.has(key)) return; // işlenirken kaldırıldı

      update(key, { status: "uploading" });
      batchId.current ??= crypto.randomUUID();
      const id = crypto.randomUUID();
      const paths = {
        thumb: `products/${batchId.current}/${id}-thumb.${thumb.ext}`,
        full: `products/${batchId.current}/${id}-full.${full.ext}`,
      };
      const uploaded: string[] = [];
      try {
        for (const [path, encoded] of [
          [paths.thumb, thumb],
          [paths.full, full],
        ] as const) {
          const { error } = await supabase.storage
            .from(IMAGE_BUCKET)
            .upload(path, encoded.blob, { contentType: encoded.blob.type, cacheControl: "31536000", upsert: false });
          if (error) throw error;
          uploaded.push(path);
          freshPaths.current.add(path);
        }
      } catch {
        // Yarım kalan yüklemenin diğer boyutu da silinir: kırık fotoğraf referansı oluşmaz.
        await removeFiles(uploaded).catch(() => {});
        update(key, { status: "error", error: UPLOAD_ERROR });
        return;
      }
      if (!keys.current.has(key)) {
        await removeFiles(uploaded).catch(() => {});
        return;
      }
      update(key, {
        status: "ready",
        data: { path_thumb: paths.thumb, path_full: paths.full, width: full.width, height: full.height },
      });
    },
    [removeFiles, supabase, update],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      const room = MAX_IMAGES - keys.current.size;
      const accepted = files.slice(0, Math.max(room, 0));
      const added: PickerImage[] = accepted.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        objectUrls.current.add(previewUrl);
        return { key: crypto.randomUUID(), previewUrl, status: "processing", fresh: true };
      });
      added.forEach((img) => keys.current.add(img.key));
      setImages((list) => [...list, ...added]);
      // Telefon belleğini zorlamamak için fotoğraflar sırayla işlenir.
      added.forEach((img, i) => {
        queue.current = queue.current.then(() => processOne(img.key, accepted[i]));
      });
      return files.length - accepted.length; // sığmayan sayısı
    },
    [processOne],
  );

  const remove = useCallback(
    (key: string) => {
      const img = images.find((i) => i.key === key);
      keys.current.delete(key);
      setImages((list) => list.filter((i) => i.key !== key));
      if (img?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(img.previewUrl);
        objectUrls.current.delete(img.previewUrl);
      }
      // Kaydedilmiş fotoğrafın dosyaları ürün kaydedilince sunucuda silinir; yeni yüklenenler hemen silinir.
      if (img?.fresh && img.data) void removeFiles([img.data.path_thumb, img.data.path_full]).catch(() => {});
    },
    [images, removeFiles],
  );

  const move = useCallback((key: string, delta: -1 | 1) => {
    setImages((list) => {
      const from = list.findIndex((i) => i.key === key);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= list.length) return list;
      const next = [...list];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }, []);

  const reorder = useCallback((orderedKeys: string[]) => {
    setImages((list) => orderedKeys.map((k) => list.find((i) => i.key === k)!).filter(Boolean));
  }, []);

  /** Ürün kaydedildi: bu oturumun yüklemeleri artık ürüne ait, temizlenmez. */
  const markSaved = useCallback(() => {
    freshPaths.current.clear();
    setImages((list) => list.map((i) => ({ ...i, fresh: false })));
  }, []);

  // Sayfadan çıkışta kaydedilmemiş yüklemeleri sil.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      token.current = session?.access_token ?? null;
    });
    void supabase.auth.getSession().then(({ data }) => {
      token.current = data.session?.access_token ?? null;
    });

    // Sekme kapanırken normal istekler iptal edilebilir; keepalive ile Storage'a doğrudan silme isteği gider.
    const onPageHide = (e: PageTransitionEvent) => {
      if (e.persisted || !freshPaths.current.size || !token.current) return;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !anonKey) return;
      void fetch(`${url}/storage/v1/object/${IMAGE_BUCKET}`, {
        method: "DELETE",
        keepalive: true,
        headers: { apikey: anonKey, Authorization: `Bearer ${token.current}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: [...freshPaths.current] }),
      }).catch(() => {});
      freshPaths.current.clear();
    };
    window.addEventListener("pagehide", onPageHide);

    const urls = objectUrls.current;
    const pending = freshPaths.current;
    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener("pagehide", onPageHide);
      // Uygulama içinde başka sayfaya geçildi (kaydetmeden).
      if (pending.size) void supabase.storage.from(IMAGE_BUCKET).remove([...pending]).catch(() => {});
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [supabase]);

  const busy = images.some((i) => i.status === "processing" || i.status === "uploading");
  const hasErrors = images.some((i) => i.status === "error");
  const hasFresh = images.some((i) => i.fresh);

  return { images, addFiles, remove, move, reorder, markSaved, busy, hasErrors, hasFresh };
}

type Uploads = ReturnType<typeof useImageUploads>;

export function ImagePicker({ uploads }: { uploads: Uploads }) {
  const { images, addFiles, remove, move, reorder } = uploads;
  const [notice, setNotice] = useState<string | null>(null);
  const full = images.length >= MAX_IMAGES;

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // aynı fotoğraf yeniden seçilebilsin
    const skipped = addFiles(files);
    setNotice(skipped > 0 ? `En fazla ${MAX_IMAGES} fotoğraf eklenebilir; ${skipped} fotoğraf eklenmedi.` : null);
  }

  return (
    <fieldset>
      <legend className="text-[0.9375rem] font-semibold">
        Fotoğraflar <span className="font-normal text-text-muted">({images.length}/{MAX_IMAGES})</span>
      </legend>
      <p className="caption mt-1 text-text-muted">İlk fotoğraf kapaktır. Sırayı tutamaçtan sürükleyerek ya da oklarla değiştirin.</p>

      {images.length > 0 && (
        <Reorder.Group
          axis="y"
          values={images.map((i) => i.key)}
          onReorder={reorder}
          className="mt-3 flex flex-col gap-2"
        >
          {images.map((img, index) => (
            <PickerRow
              key={img.key}
              image={img}
              index={index}
              count={images.length}
              onRemove={() => remove(img.key)}
              onMove={(d) => move(img.key, d)}
            />
          ))}
        </Reorder.Group>
      )}

      <label
        className={`pressable mt-3 flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line font-semibold ${
          full ? "pointer-events-none opacity-50" : "cursor-pointer text-accent"
        }`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {full ? "Fotoğraf sınırına ulaşıldı" : "Fotoğraf ekle"}
        <input type="file" accept="image/*" multiple disabled={full} onChange={onChange} className="sr-only" />
      </label>
      {notice && (
        <p role="status" className="caption mt-2 text-text-muted">
          {notice}
        </p>
      )}
    </fieldset>
  );
}

const STATUS_TEXT: Record<PickerImage["status"], string> = {
  processing: "Hazırlanıyor…",
  uploading: "Yükleniyor…",
  ready: "",
  error: "",
};

function PickerRow({
  image,
  index,
  count,
  onRemove,
  onMove,
}: {
  image: PickerImage;
  index: number;
  count: number;
  onRemove: () => void;
  onMove: (delta: -1 | 1) => void;
}) {
  const controls = useDragControls();
  const busy = image.status === "processing" || image.status === "uploading";

  return (
    <Reorder.Item
      value={image.key}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-2 rounded-2xl bg-surface p-2 shadow-[var(--shadow-soft)]"
    >
      <button
        type="button"
        aria-label="Sürükleyerek taşı"
        onPointerDown={(e) => controls.start(e)}
        className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center text-text-muted active:cursor-grabbing"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>

      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.previewUrl} alt="" draggable={false} className={`size-full object-cover ${busy ? "opacity-50" : ""}`} />
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="size-5 rounded-full border-2 border-accent border-t-transparent motion-safe:animate-spin" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {index === 0 && image.status !== "error" && (
          <span className="caption inline-block rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-text">Kapak</span>
        )}
        {image.status === "error" ? (
          <p role="alert" className="caption text-danger">
            {image.error}
          </p>
        ) : (
          busy && <p className="caption text-text-muted">{STATUS_TEXT[image.status]}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center">
        <IconButton label="Yukarı taşı" disabled={index === 0} onClick={() => onMove(-1)} d="M6 15l6-6 6 6" />
        <IconButton label="Aşağı taşı" disabled={index === count - 1} onClick={() => onMove(1)} d="M6 9l6 6 6-6" />
        <IconButton label="Fotoğrafı kaldır" onClick={onRemove} d="M6 6l12 12M18 6L6 18" />
      </div>
    </Reorder.Item>
  );
}

function IconButton({ label, d, disabled, onClick }: { label: string; d: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="pressable flex size-11 items-center justify-center rounded-full text-text-muted disabled:opacity-25"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </button>
  );
}

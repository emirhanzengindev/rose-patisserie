"use client";

import { animate, motion, useMotionValue, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import { ViewTransition, useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { nearestIndex, project, rubberband } from "@/lib/physics";
import { publicImageUrl } from "@/lib/storage";
import type { ProductImage } from "@/lib/types";

const DRAG_THRESHOLD = 10; // px: bundan kısa yatay hareket sürükleme sayılmaz.
const VELOCITY_WINDOW = 100; // ms: bırakış hızı son 100 ms'den hesaplanır.

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  dragging: boolean;
  history: { t: number; x: number }[];
};

type Props = {
  images: ProductImage[];
  title: string;
  /** Ürün kartındaki kapakla aynı ad: kapak kartın yerinden büyüyerek gelir. */
  transitionName?: string;
};

/** Momentumlu fotoğraf galerisi: parmak hızını devralır, en yakın fotoğrafa oturur, uçlarda lastik bant direnci. */
export function Gallery({ images, title, transitionName }: Props) {
  const count = images.length;
  const viewportRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const x = useMotionValue(0);
  const reducedMotion = useReducedMotion();

  // Genişlik değişince (döndürme, pencere boyutu) mevcut fotoğrafta kal.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!gesture.current?.dragging) x.set(-index * width);
    // index değişimi goTo içinde animasyonla yapılır; burada yalnızca genişlik değişimi işlenir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  const goTo = useCallback(
    (target: number, { bounce = 0, velocity = 0 }: { bounce?: number; velocity?: number } = {}) => {
      const next = Math.min(Math.max(target, 0), count - 1);
      setIndex(next);
      controls.current?.stop();
      controls.current = animate(
        x,
        -next * width,
        reducedMotion ? { duration: 0 } : { type: "spring", bounce, duration: 0.4, velocity },
      );
    },
    [count, reducedMotion, width, x],
  );

  if (count === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl bg-surface text-6xl text-gold" aria-hidden="true">
        ✿
      </div>
    );
  }

  const canDrag = count > 1;
  const first = images[0];
  const ratio = Math.min(Math.max(first.width / first.height, 0.8), 4 / 3);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!canDrag || !width || (e.pointerType === "mouse" && e.button !== 0)) return;
    // Animasyon sürerken tutulursa durur ve o anki konumdan devralınır.
    controls.current?.stop();
    gesture.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: x.get(),
      dragging: false,
      history: [{ t: e.timeStamp, x: e.clientX }],
    };
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;

    if (!g.dragging) {
      if (Math.abs(dx) >= DRAG_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        g.dragging = true;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // İşaretçi bu arada bırakıldıysa yakalama yapılamaz; sürükleme yine de çalışır.
        }
      } else if (Math.abs(dy) >= DRAG_THRESHOLD) {
        // Dikey hareket: sayfa kaydırması tarayıcıda kalsın.
        gesture.current = null;
        settle();
        return;
      } else {
        return;
      }
    }

    const min = -(count - 1) * width;
    let next = g.originX + dx;
    if (next > 0) next = rubberband(next, width);
    else if (next < min) next = min + rubberband(next - min, width);
    x.set(next);

    g.history.push({ t: e.timeStamp, x: e.clientX });
    while (g.history.length > 2 && e.timeStamp - g.history[0].t > VELOCITY_WINDOW) g.history.shift();
  }

  function onPointerEnd(e: PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    gesture.current = null;
    if (!g.dragging) return settle();

    const oldest = g.history[0];
    const newest = g.history[g.history.length - 1];
    const dt = newest.t - oldest.t;
    const velocity = dt > 0 ? ((newest.x - oldest.x) / dt) * 1000 : 0; // px/s
    goTo(nearestIndex(x.get() + project(velocity), width, count), { bounce: 0.15, velocity });
  }

  /** Durdurulan animasyonu (sürüklemeden bırakılan dokunuş) en yakın fotoğrafa oturtur. */
  function settle() {
    if (width) goTo(nearestIndex(x.get(), width, count));
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!canDrag) return;
    if (e.key === "ArrowRight") goTo(index + 1);
    else if (e.key === "ArrowLeft") goTo(index - 1);
    else return;
    e.preventDefault();
  }

  return (
    <section aria-roledescription="carousel" aria-label={`${title} fotoğrafları`} className="relative">
      <div
        ref={viewportRef}
        tabIndex={canDrag ? 0 : undefined}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        style={{ aspectRatio: ratio }}
        className={`overflow-hidden rounded-3xl bg-surface select-none ${canDrag ? "cursor-grab touch-pan-y active:cursor-grabbing" : ""}`}
      >
        <motion.ul style={{ x }} className="flex h-full">
          {images.map((img, i) => {
            const photo = (
              // Fotoğraflar yüklenirken zaten 1600 px WebP'ye küçültülüyor; next/image gerekmez.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={publicImageUrl(img.path_full)}
                alt={count > 1 ? `${title}, fotoğraf ${i + 1}/${count}` : title}
                width={img.width}
                height={img.height}
                draggable={false}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
                className="h-full w-full object-cover"
              />
            );
            return (
              <li
                key={img.id}
                aria-roledescription="slide"
                aria-hidden={i !== index}
                className="h-full w-full shrink-0"
              >
                {i === 0 && transitionName ? (
                  <ViewTransition name={transitionName} share="morph" default="none">
                    {photo}
                  </ViewTransition>
                ) : (
                  photo
                )}
              </li>
            );
          })}
        </motion.ul>
      </div>

      {canDrag && (
        <>
          <ArrowButton side="left" disabled={index === 0} onClick={() => goTo(index - 1)} />
          <ArrowButton side="right" disabled={index === count - 1} onClick={() => goTo(index + 1)} />
          <div className="mt-3 flex justify-center gap-1.5">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                aria-label={`Fotoğraf ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => goTo(i)}
                className="flex size-6 items-center justify-center"
              >
                <span
                  className={`block size-2 rounded-full transition-colors duration-200 ${
                    i === index ? "bg-accent" : "bg-text-muted/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/** Masaüstü (ince işaretçi) için ok butonları; dokunmatikte gizli. */
function ArrowButton({ side, disabled, onClick }: { side: "left" | "right"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Önceki fotoğraf" : "Sonraki fotoğraf"}
      disabled={disabled}
      onClick={onClick}
      className={`pressable glass absolute top-[calc(50%-1.125rem)] hidden size-10 -translate-y-1/2 items-center justify-center rounded-full shadow-[var(--shadow-soft)] disabled:opacity-0 pointer-fine:flex ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={side === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}

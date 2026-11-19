// apple-design: momentum projeksiyonu, lastik bant ve en yakın hedefe oturma.

/** Bırakış hızından (px/s) parmağın "gideceği" mesafeyi tahmin eder. */
export function project(velocity: number, decel = 0.998): number {
  return ((velocity / 1000) * decel) / (1 - decel);
}

/** Sınır dışına taşmayı azalan dirençle küçültür; işaret korunur. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** translateX konumuna en yakın slayt indeksi, [0, count-1] aralığında. */
export function nearestIndex(translateX: number, slideWidth: number, count: number): number {
  const index = Math.round(-translateX / slideWidth);
  return Math.min(Math.max(index, 0), Math.max(count - 1, 0));
}

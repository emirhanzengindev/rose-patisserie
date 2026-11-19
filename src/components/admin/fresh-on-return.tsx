"use client";

import { Fragment, useLayoutEffect, useState, type ReactNode } from "react";

/**
 * Next.js (Cache Components) ayrılan sayfaları <Activity> ile gizleyip durumunu saklar. Yönetim formları için
 * bu istenmez: sayfaya geri dönüldüğünde form sunucudaki güncel veriyle sıfırdan açılmalı.
 */
export function FreshOnReturn({ children }: { children: ReactNode }) {
  const [generation, setGeneration] = useState(0);
  // Gizlenirken temizlik çalışır; anahtar değişir, sayfa yeniden göründüğünde içerik yeniden kurulur.
  useLayoutEffect(() => () => setGeneration((g) => g + 1), []);
  return <Fragment key={generation}>{children}</Fragment>;
}

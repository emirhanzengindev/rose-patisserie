"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/yonetim", label: "Ürünler", icon: "M4 7h16M4 12h16M4 17h10", match: (p: string) => p === "/yonetim" || p.startsWith("/yonetim/urun") },
  { href: "/yonetim/kategoriler", label: "Kategoriler", icon: "M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z", match: (p: string) => p.startsWith("/yonetim/kategoriler") },
  { href: "/yonetim/ayarlar", label: "Ayarlar", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2 1-2-1V5h-4v2l-2 1-2-1-2 4 2 1v2l-2 1 2 4 2-1 2 1v2h4v-2l2-1 2 1 2-4-2-1z", match: (p: string) => p.startsWith("/yonetim/ayarlar") },
  { href: "/", label: "Siteyi gör", icon: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5", match: () => false },
] as const;

/** Telefon öncelikli alt sekme çubuğu. Adres istek anında bilindiğinden <Suspense> içinde kullanılır. */
export function TabBar() {
  return <TabBarView pathname={usePathname()} />;
}

/** Aktif sekme bilgisi olmadan da çizilebilir: <Suspense> yedeği olarak statik kabukta durur. */
export function TabBarView({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Yönetim menüsü" className="glass fixed inset-x-0 bottom-0 z-40 shadow-[0_-6px_20px_-14px_rgba(0,0,0,0.35)]">
      <ul className="mx-auto flex max-w-xl pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const active = pathname !== null && tab.match(pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                target={tab.href === "/" ? "_blank" : undefined}
                aria-current={active ? "page" : undefined}
                className={`pressable flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium ${
                  active ? "text-accent" : "text-text-muted"
                }`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={tab.icon} />
                </svg>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

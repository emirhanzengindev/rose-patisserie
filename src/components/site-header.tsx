"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Pressable } from "@/components/pressable";

const NAV = [
  { href: "/", label: "Ürünler", match: (p: string) => p === "/" || p.startsWith("/urun/") },
  { href: "/hakkinda", label: "Hakkında", match: (p: string) => p === "/hakkinda" },
] as const;

/** Buzlu cam menü. Alt çizgi yok; sayfa kaydırılınca yumuşak bir kenar gölgesi belirir. */
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 4);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="glass sticky top-0 z-40 shadow-[0_1px_0_transparent] transition-shadow duration-200 ease-out data-scrolled:shadow-[0_6px_20px_-12px_rgba(0,0,0,0.25)]"
    >
      <nav aria-label="Ana menü" className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Pressable as={Link} href="/" className="rounded-lg text-[1.0625rem] font-semibold tracking-[-0.01em]">
          Rose <span className="text-accent">Patisserie</span>
        </Pressable>
        <ul className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Pressable
                  as={Link}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-full px-3 py-1.5 text-[0.9375rem] ${
                    active ? "font-semibold text-text" : "text-text-muted"
                  }`}
                >
                  {item.label}
                </Pressable>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

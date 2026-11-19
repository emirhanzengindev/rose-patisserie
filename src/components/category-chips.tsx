import Link from "next/link";
import { Pressable } from "@/components/pressable";
import { catalogHref } from "@/lib/pagination";
import type { Category } from "@/lib/types";

/** Kategori düğmeleri. Seçim adrese yazılır (`/?kategori=…`), paylaşılabilir ve geri tuşu çalışır. */
export function CategoryChips({ categories, active }: { categories: Category[]; active?: string }) {
  if (categories.length === 0) return null;
  const chips = [{ slug: undefined, name: "Tümü" }, ...categories];

  return (
    <nav aria-label="Kategoriler" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
      <ul className="flex w-max gap-2 pb-1">
        {chips.map((c) => {
          const isActive = c.slug === active;
          return (
            <li key={c.slug ?? "tumu"}>
              <Pressable
                as={Link}
                href={catalogHref({ category: c.slug })}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={`block rounded-full px-4 py-2 text-[0.9375rem] whitespace-nowrap ${
                  isActive
                    ? "bg-accent font-semibold text-accent-text"
                    : "bg-surface text-text shadow-[var(--shadow-soft)]"
                }`}
              >
                {c.name}
              </Pressable>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

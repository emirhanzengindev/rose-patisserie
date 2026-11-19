import type { ReactNode } from "react";
import { Suspense } from "react";
import { signOut } from "@/app/yonetim/actions/auth";
import { TabBar, TabBarView } from "@/components/admin/tab-bar";
import { requireAdmin } from "@/lib/auth";
import { PanelSkeleton } from "./loading";

// Çerçeve (üst satır, sekme çubuğu) statik kabukta; oturum kontrolü <Suspense> içinde istek anında yapılır.
export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)]">
      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-4 pt-3">
        {/* Büyük harf dönüşümü yok: lang="tr" ile "Patisserie" → "PATİSSERİE" olurdu. */}
        <p className="caption font-semibold text-gold">Rose Patisserie · Yönetim</p>
        <form action={signOut}>
          <button type="submit" className="caption min-h-11 px-1 text-text-muted hover:text-text">
            Çıkış
          </button>
        </form>
      </header>
      <div className="mx-auto w-full max-w-xl flex-1 px-4">
        <Suspense fallback={<PanelSkeleton />}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </div>
      <Suspense fallback={<TabBarView pathname={null} />}>
        <TabBar />
      </Suspense>
    </div>
  );
}

async function AdminGate({ children }: { children: ReactNode }) {
  await requireAdmin();
  return children;
}

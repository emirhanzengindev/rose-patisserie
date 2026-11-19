"use client";

import { Reorder, useDragControls } from "motion/react";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { deleteCategory, reorderCategories, saveCategory } from "@/app/yonetim/actions/catalog";
import { FreshOnReturn } from "@/components/admin/fresh-on-return";
import type { AdminCategory } from "@/lib/queries";

type Row = AdminCategory & { draft: string; error?: string; saved?: boolean };

const toRow = (c: AdminCategory): Row => ({ ...c, draft: c.name });

export function CategoryList({ categories }: { categories: AdminCategory[] }) {
  return (
    <FreshOnReturn>
      <CategoryListInner categories={categories} />
    </FreshOnReturn>
  );
}

function CategoryListInner({ categories }: { categories: AdminCategory[] }) {
  const [rows, setRows] = useState<Row[]>(() => categories.map(toRow));
  const [listError, setListError] = useState<string | null>(null);
  const [adding, startAdding] = useTransition();
  const [, startTransition] = useTransition();
  // Olay işleyicileri (sürükleme bitişi, oklar) en güncel sırayı buradan okur.
  const latest = useRef(rows);
  useEffect(() => {
    latest.current = rows;
  }, [rows]);
  const orderBeforeDrag = useRef<string[] | null>(null);

  const patch = (id: string, p: Partial<Row>) => setRows((list) => list.map((r) => (r.id === id ? { ...r, ...p } : r)));

  function persistOrder(next: Row[], previous: string[]) {
    const ids = next.map((r) => r.id);
    if (ids.join() === previous.join()) return;
    setListError(null);
    startTransition(async () => {
      const result = await reorderCategories(ids);
      if (!result.ok) {
        setListError(result.error);
        setRows((list) => previous.map((id) => list.find((r) => r.id === id)!).filter(Boolean));
      }
    });
  }

  function move(id: string, delta: -1 | 1) {
    const list = latest.current;
    const from = list.findIndex((r) => r.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= list.length) return;
    const next = [...list];
    [next[from], next[to]] = [next[to], next[from]];
    setRows(next);
    persistOrder(next, list.map((r) => r.id));
  }

  function rename(row: Row) {
    const name = row.draft.trim();
    if (name === row.name) return patch(row.id, { draft: row.name, error: undefined });
    startTransition(async () => {
      const result = await saveCategory({ id: row.id, name });
      if (result.ok) patch(row.id, { name: result.data.name, draft: result.data.name, error: undefined, saved: true });
      else patch(row.id, { error: result.error });
    });
  }

  function remove(row: Row) {
    if (row.productCount > 0) {
      return patch(row.id, { error: "Bu kategoride ürünler var. Önce ürünleri başka kategoriye taşıyın." });
    }
    if (!window.confirm(`“${row.name}” kategorisi silinsin mi?`)) return;
    startTransition(async () => {
      const result = await deleteCategory(row.id);
      if (result.ok) setRows((list) => list.filter((r) => r.id !== row.id));
      else patch(row.id, { error: result.error });
    });
  }

  // Alan kontrolsüz: sayfa JS'i yüklenmeden yazılan metin de kaybolmaz (yavaş bağlantıda telefon).
  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = String(new FormData(form).get("name") ?? "");
    setListError(null);
    startAdding(async () => {
      const result = await saveCategory({ name });
      if (!result.ok) return setListError(result.error);
      setRows((list) => [...list, toRow({ ...result.data, productCount: 0 })]);
      form.reset();
    });
  }

  return (
    <div className="mt-5">
      {listError && (
        <p role="alert" className="mb-3 rounded-2xl bg-danger/10 px-4 py-3 text-[0.9375rem] font-medium text-danger">
          {listError}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="py-8 text-center text-text-muted">Henüz kategori yok. Aşağıdan ilk kategoriyi ekleyin (ör. Cheesecake).</p>
      ) : (
        <Reorder.Group
          axis="y"
          values={rows.map((r) => r.id)}
          onReorder={(ids: string[]) => setRows((list) => ids.map((id) => list.find((r) => r.id === id)!))}
          className="flex flex-col gap-2"
        >
          {rows.map((row, index) => (
            <CategoryRow
              key={row.id}
              row={row}
              first={index === 0}
              last={index === rows.length - 1}
              onDraft={(draft) => patch(row.id, { draft, saved: false })}
              onRename={() => rename(latest.current.find((r) => r.id === row.id)!)}
              onMove={(d) => move(row.id, d)}
              onRemove={() => remove(row)}
              onDragStart={() => (orderBeforeDrag.current = latest.current.map((r) => r.id))}
              onDragEnd={() => {
                if (orderBeforeDrag.current) persistOrder(latest.current, orderBeforeDrag.current);
                orderBeforeDrag.current = null;
              }}
            />
          ))}
        </Reorder.Group>
      )}

      <form onSubmit={add} className="mt-6 flex gap-2">
        <label className="sr-only" htmlFor="new-category">
          Yeni kategori adı
        </label>
        <input
          id="new-category"
          name="name"
          placeholder="Yeni kategori (ör. Cupcake)"
          maxLength={60}
          autoComplete="off"
          enterKeyHint="done"
          className="min-h-12 min-w-0 flex-1 rounded-2xl bg-surface px-4 text-base shadow-[var(--shadow-soft)]"
        />
        <button
          type="submit"
          disabled={adding}
          className="pressable min-h-12 shrink-0 rounded-full bg-accent px-5 font-semibold text-accent-text disabled:opacity-50"
        >
          {adding ? "Ekleniyor…" : "Ekle"}
        </button>
      </form>
    </div>
  );
}

type RowProps = {
  row: Row;
  first: boolean;
  last: boolean;
  onDraft: (v: string) => void;
  onRename: () => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
};

function CategoryRow({ row, first, last, onDraft, onRename, onMove, onRemove, onDragStart, onDragEnd }: RowProps) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={row.id}
      dragListener={false}
      dragControls={controls}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="rounded-2xl bg-surface p-2 shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-start gap-1">
        <button
          type="button"
          aria-label="Sürükleyerek taşı"
          onPointerDown={(e) => controls.start(e)}
          className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center self-center text-text-muted active:cursor-grabbing"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <input
            aria-label="Kategori adı"
            value={row.draft}
            onChange={(e) => onDraft(e.target.value)}
            onBlur={onRename}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
            maxLength={60}
            enterKeyHint="done"
            className="min-h-11 w-full rounded-xl bg-transparent px-2 text-base font-semibold focus:bg-bg"
          />
          {/* Ad tam genişlikte; sayı ve butonlar alt satırda (uzun adlar kesilmesin). */}
          <div className="flex items-center justify-between">
            <p className="caption px-2 text-text-muted">
              {row.productCount ? `${row.productCount} ürün` : "Ürün yok"}
              {row.saved && <span className="text-accent"> · Kaydedildi</span>}
            </p>
            <div className="flex">
              <IconButton label="Yukarı taşı" disabled={first} onClick={() => onMove(-1)} d="M6 15l6-6 6 6" />
              <IconButton label="Aşağı taşı" disabled={last} onClick={() => onMove(1)} d="M6 9l6 6 6-6" />
              <IconButton label={`${row.name} kategorisini sil`} onClick={onRemove} d="M5 7h14M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" />
            </div>
          </div>
        </div>
      </div>
      {row.error && (
        <p role="alert" className="caption px-2 pt-1 pb-1 text-danger">
          {row.error}
        </p>
      )}
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
      className="pressable flex size-11 shrink-0 items-center justify-center rounded-full text-text-muted disabled:opacity-25"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </button>
  );
}

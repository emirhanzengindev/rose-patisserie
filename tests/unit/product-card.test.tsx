import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ProductCard } from "@/components/product-card";
import type { ProductCard as ProductCardData } from "@/lib/types";

const base: ProductCardData = {
  id: "p1",
  title: "Frambuazlı Cheesecake",
  slug: "frambuazli-cheesecake",
  // İstanbul saatiyle 12 Kasım 2026 01:30 (UTC'de hâlâ 11 Kasım).
  published_at: "2026-11-11T22:30:00Z",
  category: { name: "Cheesecake", slug: "cheesecake" },
  cover: {
    id: "i1",
    path_thumb: "p1/0-thumb.webp",
    path_full: "p1/0-full.webp",
    width: 1600,
    height: 1200,
    sort_order: 0,
  },
};

describe("ProductCard", () => {
  test("başlık, kategori ve Türkçe tarih görünür", () => {
    render(<ProductCard product={base} />);
    expect(screen.getByText("Frambuazlı Cheesecake")).toBeInTheDocument();
    expect(screen.getByText(/Cheesecake ·/)).toBeInTheDocument();
    expect(screen.getByText(/12 Kasım 2026/)).toBeInTheDocument();
  });

  test("/urun/<slug> adresine bağlanır", () => {
    render(<ProductCard product={base} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/urun/frambuazli-cheesecake");
  });

  test("kapak küçük boy fotoğraftır, alt metni ürün adıdır ve tembel yüklenir", () => {
    render(<ProductCard product={base} />);
    const img = screen.getByRole("img", { name: "Frambuazlı Cheesecake" });
    expect(img.getAttribute("src")).toContain("/storage/v1/object/public/product-images/p1/0-thumb.webp");
    expect(img).toHaveAttribute("loading", "lazy");
    // Küçük boyun ölçüleri (uzun kenar 640): yerleşim kayması olmasın diye verilir.
    expect(img).toHaveAttribute("width", "640");
    expect(img).toHaveAttribute("height", "480");
  });

  test("kapak yoksa yer tutucu gösterir ve çökmez", () => {
    render(<ProductCard product={{ ...base, cover: null }} />);
    expect(screen.getByTestId("cover-placeholder")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Frambuazlı Cheesecake" })).toBeNull();
    expect(screen.getByText("Frambuazlı Cheesecake")).toBeInTheDocument();
  });
});

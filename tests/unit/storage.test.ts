import { expect, test } from "vitest";
import { publicImageUrl } from "@/lib/storage";

test("Supabase public URL'sini üretir", () => {
  expect(publicImageUrl("p/a-thumb.webp", "https://x.supabase.co")).toBe(
    "https://x.supabase.co/storage/v1/object/public/product-images/p/a-thumb.webp",
  );
});

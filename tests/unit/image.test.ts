import { expect, test } from "vitest";
import { fitWithin } from "@/lib/image";

test("uzun kenarı sınıra indirir, oranı korur", () => {
  expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
  expect(fitWithin(3000, 4000, 640)).toEqual({ width: 480, height: 640 });
});
test("küçük görseli büyütmez", () => {
  expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
});

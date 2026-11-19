import { expect, test } from "vitest";
import { formatDateTr } from "@/lib/format";

test("tarihi Türkçe uzun biçimde, İstanbul saatine göre yazar", () => {
  expect(formatDateTr("2026-11-12T10:00:00Z")).toBe("12 Kasım 2026");
  expect(formatDateTr("2026-11-12T22:30:00Z")).toBe("13 Kasım 2026");
});

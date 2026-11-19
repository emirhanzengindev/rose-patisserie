import { describe, expect, test } from "vitest";
import { nearestIndex, project, rubberband } from "@/lib/physics";

describe("project (momentum projeksiyonu, d=0.998)", () => {
  test("hızı mesafeye çevirir", () => {
    expect(project(1000)).toBeCloseTo(499);
    expect(project(0)).toBe(0);
    expect(project(-500)).toBeCloseTo(-249.5);
  });
});

describe("rubberband", () => {
  test("taşma yoksa sıfır", () => expect(rubberband(0, 300)).toBe(0));
  test("taşmayı azaltır ve işareti korur", () => {
    expect(rubberband(100, 300)).toBeCloseTo(46.48, 1);
    expect(rubberband(-100, 300)).toBeCloseTo(-46.48, 1);
  });
});

describe("nearestIndex", () => {
  test("en yakın slayta yuvarlar", () => {
    expect(nearestIndex(-350, 300, 4)).toBe(1);
    expect(nearestIndex(-460, 300, 4)).toBe(2);
  });
  test("sınırlara sıkıştırır", () => {
    expect(nearestIndex(100, 300, 4)).toBe(0);
    expect(nearestIndex(-5000, 300, 4)).toBe(3);
  });
});

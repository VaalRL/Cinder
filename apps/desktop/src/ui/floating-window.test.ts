import { describe, expect, it } from "vitest";
import { cascade, clampRect, nextZ } from "./floating-window.js";

describe("floating-window 純幾何（ADR-0216）", () => {
  const bounds = { w: 800, h: 600 };

  it("clampRect：位置出界拉回、尺寸超過畫布夾小", () => {
    expect(clampRect({ x: -50, y: -10, w: 300, h: 200 }, bounds)).toEqual({ x: 0, y: 0, w: 300, h: 200 });
    expect(clampRect({ x: 700, y: 500, w: 300, h: 200 }, bounds)).toEqual({ x: 500, y: 400, w: 300, h: 200 });
    expect(clampRect({ x: 0, y: 0, w: 1000, h: 900 }, bounds)).toEqual({ x: 0, y: 0, w: 800, h: 600 });
  });

  it("cascade：往右下層疊、循環、且夾進畫布", () => {
    expect(cascade(0, bounds, { w: 380, h: 460 })).toEqual({ x: 0, y: 0, w: 380, h: 460 });
    expect(cascade(2, bounds, { w: 380, h: 460 })).toEqual({ x: 56, y: 56, w: 380, h: 460 });
    // 第 6 個回到 0（CYCLE=6）
    expect(cascade(6, bounds, { w: 380, h: 460 })).toEqual(cascade(0, bounds, { w: 380, h: 460 }));
  });

  it("cascade：畫布過小時偏移仍被夾住不出界", () => {
    const small = { w: 400, h: 480 };
    const r = cascade(5, small, { w: 380, h: 460 });
    expect(r.x).toBeLessThanOrEqual(small.w - r.w);
    expect(r.y).toBeLessThanOrEqual(small.h - r.h);
    expect(r.x).toBeGreaterThanOrEqual(0);
  });

  it("nextZ：比最大 +1；空回 1", () => {
    expect(nextZ([])).toBe(1);
    expect(nextZ([1, 3, 2])).toBe(4);
  });
});

// 浮動視窗純幾何邏輯（ADR-0216）：clamp（夾進畫布）、cascade（新窗層疊預設位）、
// nextZ（置頂 z 序）。純函式、可測；localStorage 與 DOM 量測留在 useFloatingWindow hook。

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Bounds {
  w: number;
  h: number;
}

/** 夾在畫布內：尺寸不超過畫布、位置不出界（左上不小於 0、右下不超出）。 */
export function clampRect(rect: Rect, bounds: Bounds): Rect {
  const w = Math.max(0, Math.min(rect.w, bounds.w));
  const h = Math.max(0, Math.min(rect.h, bounds.h));
  const x = Math.max(0, Math.min(rect.x, bounds.w - w));
  const y = Math.max(0, Math.min(rect.y, bounds.h - h));
  return { x, y, w, h };
}

/** 新窗層疊預設位（每個往右下偏移 step，循環避免無限外移）；仍夾進畫布。 */
export function cascade(index: number, bounds: Bounds, size: { w: number; h: number }): Rect {
  const STEP = 28;
  const CYCLE = 6;
  const off = (((index % CYCLE) + CYCLE) % CYCLE) * STEP;
  return clampRect({ x: off, y: off, w: size.w, h: size.h }, bounds);
}

/** 下一個最上層 z（比現有最大 +1；空清單回 1）。 */
export function nextZ(zs: number[]): number {
  return (zs.length ? Math.max(...zs) : 0) + 1;
}

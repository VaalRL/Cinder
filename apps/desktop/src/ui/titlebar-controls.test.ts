import { describe, expect, it } from "vitest";
import {
  DEFAULT_TITLEBAR_CONTROLS,
  moveControl,
  parseTitlebarControls,
  serializeTitlebarControls,
  type ControlId,
} from "./titlebar-controls.js";

describe("titlebar-controls 標題列按鈕設定（ADR-0150）", () => {
  it("未設／壞 JSON／非物件 → 預設（右側、─ □ ✕）", () => {
    expect(DEFAULT_TITLEBAR_CONTROLS).toEqual({ side: "right", order: ["min", "max", "close"] });
    expect(parseTitlebarControls(null)).toEqual(DEFAULT_TITLEBAR_CONTROLS);
    expect(parseTitlebarControls("")).toEqual(DEFAULT_TITLEBAR_CONTROLS);
    expect(parseTitlebarControls("{oops")).toEqual(DEFAULT_TITLEBAR_CONTROLS);
    expect(parseTitlebarControls("42")).toEqual(DEFAULT_TITLEBAR_CONTROLS);
  });

  it("正規化：未知 id 剔除、重複去重、缺漏補齊、side 只認 left/right", () => {
    const c = parseTitlebarControls(JSON.stringify({ side: "left", order: ["close", "close", "nope", "min"] }));
    expect(c).toEqual({ side: "left", order: ["close", "min", "max"] });
    expect(parseTitlebarControls(JSON.stringify({ side: "top", order: [] })).side).toBe("right");
  });

  it("serialize → parse 往返不變", () => {
    const raw = serializeTitlebarControls({ side: "left", order: ["close", "max", "min"] });
    expect(parseTitlebarControls(raw)).toEqual({ side: "left", order: ["close", "max", "min"] });
  });

  it("moveControl：左右移一格、到邊界不動、不改原陣列（純函式）", () => {
    const order: ControlId[] = ["min", "max", "close"];
    expect(moveControl(order, "max", -1)).toEqual(["max", "min", "close"]);
    expect(moveControl(order, "max", 1)).toEqual(["min", "close", "max"]);
    expect(moveControl(order, "min", -1)).toEqual(["min", "max", "close"]); // 左邊界
    expect(moveControl(order, "close", 1)).toEqual(["min", "max", "close"]); // 右邊界
    expect(order).toEqual(["min", "max", "close"]); // 原陣列不動
  });
});

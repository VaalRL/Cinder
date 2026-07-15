// @vitest-environment jsdom
//
// 自訂主色套用到 DOM 的 **useEffect** 測試（Tier 4 / ADR-0130）。
//
// `AccentProvider` 用 `useEffect` 把 `--accent` CSS 變數寫到 root（或在無自訂色時移除，回到樣式表
// 內建亮/暗色）。這也是 SSR 測不到的一段——effect 不跑，CSS 變數就不會被設。

import { beforeEach, describe, expect, it } from "vitest";
import { AccentProvider } from "./accent.js";
import { ThemeProvider } from "./theme.js";
import { mount } from "./test/jsdom-mount.js";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("style");
});

const wrap = (children: JSX.Element): JSX.Element => (
  <ThemeProvider>
    <AccentProvider>{children}</AccentProvider>
  </ThemeProvider>
);

describe("自訂主色套用到 DOM（useEffect，ADR-0130）", () => {
  it("有自訂主色 → 掛載即把 `--accent` 寫到 root", () => {
    localStorage.setItem("nb.accent", "#3366ff");
    mount(wrap(<span />));
    expect(document.documentElement.style.getPropertyValue("--accent")).toBeTruthy();
  });

  it("無自訂主色 → **不設** `--accent`（回到樣式表內建色）", () => {
    document.documentElement.style.setProperty("--accent", "#leftover"); // 模擬殘留
    mount(wrap(<span />));
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe(""); // effect 移除了它
  });
});

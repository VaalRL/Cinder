// @vitest-environment jsdom
//
// 主題套用到 DOM 的 **useEffect** 測試（Tier 4 / ADR-0130）。
//
// `ThemeProvider` 用 `useEffect` 把 `data-theme` 寫到 `document.documentElement`——這是**深淺主題
// 實際生效**的地方。過去所有 UI 測試都是 SSR（`renderToStaticMarkup`），**effect 從不執行**，
// 所以「主題有沒有真的套到 DOM」一直零測試。這裡在 jsdom 掛載、跑真的 effect 來釘住它。

import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "./theme.js";
import { mount } from "./test/jsdom-mount.js";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

function Toggle(): JSX.Element {
  const { setTheme } = useTheme();
  return (
    <button data-testid="dark" onClick={() => setTheme("dark")}>
      dark
    </button>
  );
}

describe("主題套用到 DOM（useEffect，ADR-0130）", () => {
  it("🔴 掛載後 `data-theme` **真的被寫到 root**——SSR 從不做這件事", () => {
    mount(
      <ThemeProvider>
        <span />
      </ThemeProvider>,
    );
    // 無 localStorage、無 matchMedia → 預設 light。重點是屬性**存在**（effect 跑了）。
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("localStorage 記著 dark → 掛載即套用 dark", () => {
    localStorage.setItem("nb.theme", "dark");
    mount(
      <ThemeProvider>
        <span />
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("切換主題 → DOM 屬性即時更新（effect 依 theme 重跑）", () => {
    const { container } = mount(
      <ThemeProvider>
        <Toggle />
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    act(() => (container.querySelector("[data-testid=dark]") as HTMLButtonElement).click());
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    // 且落地（下次開機 initialTheme 讀得回）。
    expect(localStorage.getItem("nb.theme")).toBe("dark");
  });
});

// jsdom 掛載小工具（Tier 4 / ADR-0130）：讓測試能**真的掛載 React 元件並跑 useEffect**。
//
// 這個專案過去所有 UI 測試都是 `renderToStaticMarkup`（SSR、node 環境）——SSR 只渲染一次靜態
// HTML，**`useEffect` 從不執行**。於是任何寫在 effect 裡的邏輯（開機自動登入、已讀觸發、
// 主題套用到 DOM…）都零覆蓋。ADR-0122 那個「瀏覽器重載換身分」的 P0 就是藏在開機 effect 裡、
// 因此躲過所有測試。
//
// 用 `react-dom/client` 的 `createRoot` ＋ `react` 的 `act`（免 @testing-library；react-dom 本就在）。
// 使用端須在檔案頂端標 `// @vitest-environment jsdom`（逐檔切環境，不動既有 305 個 node-env SSR 測試）。

import { act } from "react";
import type { ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";

// 告訴 React 這是 act 測試環境（否則 effect 的排程會發出警告、也可能不被沖刷）。
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom 環境未穩定暴露 `localStorage` 全域（node 22 的實驗性 localStorage 會干擾）——裝一個
// Map-backed shim，與既有 SSR 測試同一招。元件的 `localStorage.xxx` 才有東西可用。
if (typeof (globalThis as { localStorage?: unknown }).localStorage === "undefined") {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      get length() {
        return store.size;
      },
      key: (i: number) => [...store.keys()][i] ?? null,
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    },
  });
}

export interface Mounted {
  /** 掛載點（可用 querySelector 斷言 DOM）。 */
  container: HTMLElement;
  /** 以新元素重渲染（測 deps 變動觸發 effect）。 */
  rerender(next: ReactElement): void;
  /** 卸載（測 cleanup）。 */
  unmount(): void;
}

/** 掛載一個元件到 jsdom，並在 `act` 中沖刷首次的 effect。 */
export function mount(element: ReactElement): Mounted {
  const container = document.createElement("div");
  document.body.appendChild(container);
  let root: Root;
  act(() => {
    root = createRoot(container);
    root.render(element);
  });
  return {
    container,
    rerender(next: ReactElement): void {
      act(() => root.render(next));
    },
    unmount(): void {
      act(() => root.unmount());
      container.remove();
    },
  };
}

// 原生檔案拖放（ADR-0104）：Tauri 的 OS 級拖放事件。
//
// ⚠ 為什麼非做不可：Tauri v2 的 `dragDropEnabled` **預設為 true**，代表 Tauri 會**攔截** OS 拖放，
//   webview 裡的 HTML5 `onDragOver`/`onDrop` **根本不會觸發**。也就是說——
//   **打包後的桌面版，拖放傳檔本來就是壞的**（只有瀏覽器預覽能用）。接上這條同時修掉該 bug。
//
// 附帶好處：OS 拖放給的是**真實檔案路徑**（瀏覽器的 File 物件基於安全不給），
// 所以拖進來的檔案也能像 ADR-0103 的原生選檔一樣記下 `savedPath`。

import { isTauri } from "@tauri-apps/api/core";

/** 拖放事件（座標為 CSS 像素，已由實體像素換算）。 */
export interface FileDropHandlers {
  /** 拖曳進入/移動中（可用來highlight）；`x`/`y` 為 CSS 像素。 */
  onHover?: (x: number, y: number) => void;
  /** 離開/取消。 */
  onLeave?: () => void;
  /** 放開：`paths` 為**真實檔案路徑**。 */
  onDrop: (paths: string[], x: number, y: number) => void;
}

/**
 * 註冊原生拖放監聽（僅 Tauri）。回傳取消註冊函式。
 * 非 Tauri（瀏覽器）不註冊——那邊照舊走 HTML5 拖放（能用，只是拿不到路徑）。
 */
export function onNativeFileDrop(handlers: FileDropHandlers): () => void {
  if (!isTauri()) return () => {};
  let unlisten: (() => void) | undefined;
  let cancelled = false;

  void (async () => {
    try {
      const { getCurrentWebview } = await import("@tauri-apps/api/webview");
      const un = await getCurrentWebview().onDragDropEvent((event) => {
        const p = event.payload;
        // Tauri 給的是**實體像素**；DOM 命中測試要 CSS 像素。
        const dpr = window.devicePixelRatio || 1;
        if (p.type === "drop") {
          handlers.onDrop(p.paths, p.position.x / dpr, p.position.y / dpr);
        } else if (p.type === "enter" || p.type === "over") {
          handlers.onHover?.(p.position.x / dpr, p.position.y / dpr);
        } else {
          handlers.onLeave?.();
        }
      });
      if (cancelled) un();
      else unlisten = un;
    } catch {
      /* 舊版 API/不支援：靜默略過，拖放僅是失效而非崩潰 */
    }
  })();

  return () => {
    cancelled = true;
    unlisten?.();
  };
}

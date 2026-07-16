// 視窗控制（ADR-0150）：自繪標題列的原生動作，接 @tauri-apps/api/window。
// 動態載入——瀏覽器版不掛 TitleBar，也就永遠不會載入這支；呼叫失敗（權限/非 Tauri）
// 一律靜默忽略，外框壞了也不能把 App 拖下水。

import type { TitleBarActions } from "../ui/TitleBar.js";

async function currentWindow() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow();
}

export const tauriTitleBarActions: TitleBarActions = {
  minimize() {
    void currentWindow()
      .then((w) => w.minimize())
      .catch(() => {});
  },
  toggleMaximize() {
    void currentWindow()
      .then((w) => w.toggleMaximize())
      .catch(() => {});
  },
  close() {
    void currentWindow()
      .then((w) => w.close())
      .catch(() => {});
  },
  // 訂閱最大化狀態（□↔❐ 圖示）：初值查一次，之後跟 resize 事件。
  onMaximized(cb) {
    let off: (() => void) | undefined;
    let dead = false;
    void (async () => {
      try {
        const w = await currentWindow();
        cb(await w.isMaximized());
        const un = await w.onResized(() => {
          void w
            .isMaximized()
            .then(cb)
            .catch(() => {});
        });
        if (dead) un();
        else off = un;
      } catch {
        /* 非 Tauri／權限不足：圖示維持 □ */
      }
    })();
    return () => {
      dead = true;
      off?.();
    };
  },
};

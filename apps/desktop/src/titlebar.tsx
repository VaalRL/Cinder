// 自繪視窗外框（ADR-0150）：TitlebarProvider 保存標題列按鈕的位置/順序（localStorage，
// 純本地 UI 偏好），WindowChrome 在 Tauri 下於整個 App 外圍加自繪標題列——包在所有畫面
// 之外，登入/解鎖畫面也有外框（否則 decorations:false 後那些畫面無法拖動/關閉）。
// 瀏覽器版外框是瀏覽器的，WindowChrome 原樣透傳。
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { tauriTitleBarActions } from "./native/window-controls.js";
import { TitleBar } from "./ui/TitleBar.js";
import {
  parseTitlebarControls,
  serializeTitlebarControls,
  TITLEBAR_CONTROLS_KEY,
  type TitlebarControls,
} from "./ui/titlebar-controls.js";

interface TitlebarContextValue {
  controls: TitlebarControls;
  setControls: (controls: TitlebarControls) => void;
}

const TitlebarContext = createContext<TitlebarContextValue | null>(null);

function initialControls(): TitlebarControls {
  try {
    return parseTitlebarControls(localStorage.getItem(TITLEBAR_CONTROLS_KEY));
  } catch {
    return parseTitlebarControls(null); // localStorage 不可用（測試/SSR）→ 預設
  }
}

export function TitlebarProvider({ children }: { children: ReactNode }): JSX.Element {
  const [controls, setControlsState] = useState<TitlebarControls>(initialControls);
  const setControls = (next: TitlebarControls): void => {
    try {
      localStorage.setItem(TITLEBAR_CONTROLS_KEY, serializeTitlebarControls(next));
    } catch {
      /* 忽略 */
    }
    setControlsState(next);
  };
  const value = useMemo<TitlebarContextValue>(() => ({ controls, setControls }), [controls]);
  return <TitlebarContext.Provider value={value}>{children}</TitlebarContext.Provider>;
}

export function useTitlebar(): TitlebarContextValue {
  const ctx = useContext(TitlebarContext);
  if (!ctx) throw new Error("useTitlebar 必須在 TitlebarProvider 內使用");
  return ctx;
}

/** Tauri 下包一層自繪外框（標題列＋內容區）；瀏覽器版原樣透傳。 */
export function WindowChrome({ children }: { children: ReactNode }): JSX.Element {
  const { controls } = useTitlebar();
  if (!isTauri()) return <>{children}</>;
  return (
    <div className="window-chrome">
      <TitleBar controls={controls} actions={tauriTitleBarActions} />
      <div className="window-chrome__body">{children}</div>
    </div>
  );
}

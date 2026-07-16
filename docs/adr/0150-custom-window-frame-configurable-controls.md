# 0150. 自繪視窗外框（decorations:false）＋標題列按鈕位置/順序可自訂

- 狀態：已接受（已實作）
- 日期：2026-07-16
- 相關文件：0079（版面佈局 provider 模式）、0139（自訂對話框——原生 UI 換自繪的先例）、
  0147（瀏覽器版＝同一 build 的 `isTauri()` 分流）、0142（設定分頁）

## 背景與問題

Cinder 桌面版用 OS 原生視窗框——最外側標題列與「─ □ ✕」是 Windows 畫的，**無法自訂樣式**。
使用者要：自訂外框按鈕的樣式，且**按鈕的位置（左/右）與排列順序**要能透過設定調整。

原生框不可能做到（OS 不開放）；唯一路徑是 Tauri 標準做法——**無邊框視窗＋前端自繪標題列**。

## 決策

使用者選定視覺風格：**簡約現代扁平**（單色底、無漸層、hover 才亮底、✕ hover 紅底）。

### 1. Tauri 層：`decorations: false`＋最小權限逐項明列

`tauri.conf.json` main 視窗關閉 OS 裝飾；capabilities 明列 `core:window:allow-minimize／
allow-toggle-maximize／allow-close／allow-start-dragging／allow-is-maximized`（維持最小權限
原則，不用寬鬆的 `core:window:default` 全開）。縮放邊緣（`resizable`）與視窗陰影由 Tauri 保留。

### 2. 設定資料：`nb.titlebarControls`（純函式核心）

`titlebar-controls.ts`：`TitlebarControls = { side: "left"|"right", order: ControlId[] }`，
預設 Windows 慣例（右側、─ □ ✕）。`parseTitlebarControls` **永遠回有效值**——壞 JSON、未知 id、
重複、缺漏一律正規化（設定損壞時視窗也不能沒有關閉鈕）；`moveControl(order, id, ±1)` 供設定 UI
逐顆左右移。純本地 UI 偏好（同 `nb.layout`），不隨快照。

### 3. 元件：`TitleBar`＋`WindowChrome`＋`TitlebarProvider`

- `TitleBar`：`data-tauri-drag-region`（拖曳＋雙擊最大化內建）、依設定 side/order 渲染三顆鈕、
  □↔❐ 跟最大化狀態、動作經 `TitleBarActions` 注入（實機接 `@tauri-apps/api/window` 動態載入，
  SSR 測試與設定頁預覽塞 no-op）。
- `WindowChrome`（main.tsx 最外層）：**包在所有畫面之外**——登入/解鎖畫面也有外框，否則
  `decorations:false` 後那些畫面無法拖動/關閉。瀏覽器版（`isTauri()=false`）原樣透傳，外框
  是瀏覽器的（ADR-0147 分流慣例）。
- `TitlebarProvider`（同 ADR-0079 `LayoutProvider` 模式）：設定頁與外框共享同一狀態，改了即生效。
- 版面：`100vh` 改 `var(--viewport-h)`（`:root` 預設 100vh；`.window-chrome` 覆寫為扣掉標題列高），
  瀏覽器版數值不變。

### 4. 設定 UI：設定 → 外觀 → 「視窗外框」

僅 Tauri 顯示（`showTitlebarSettings`，App 以 `isTauri()` 決定）：**迷你預覽**（重用同一個
`TitleBar` 元件、`preview` 模式不可互動）＋位置左/右 radio＋順序三顆 chip 各有 ←→ 逐顆移動。

## 後果

- 正面：
  - 外框樣式完全自主（扁平風、跟亮暗主題與主色 token 連動），按鈕位置/順序使用者可自訂。
  - 解析防呆＋動作注入：設定壞掉不失控、元件可測（SSR）；權限逐項明列維持最小面。
  - 測試 +10（titlebar-controls 4／TitleBar 3／WindowChrome 透傳 1／SettingsPanel 2）。
    全綠 engine 245／desktop 351／mobile 145／i18n 8。
- 已知限制／取捨：
  - **Windows 11 Snap Layouts 懸停選單消失**（原生「□」才有；`Win+方向鍵` 貼齊仍可用）——
    所有自繪框 app（VS Code/Discord）的共同取捨。
  - 標題列高固定 32px（`--titlebar-h`）；macOS 紅綠燈式圓鈕未做（Windows 先行，跨平台細節
    留待有 mac 目標時另議）。
  - 瀏覽器版不受影響也不顯示此設定區（外框是瀏覽器的，管不到）。

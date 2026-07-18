# 0198. 桌面關閉確認改用 app 風格對話框（取代原生 rfd）

- 狀態：已接受
- 日期：2026-07-18
- 相關文件：`apps/desktop/src-tauri/src/main.rs`、`apps/desktop/src/App.tsx`、`apps/desktop/src/ui/Dialog.tsx`、`packages/i18n/src/messages.ts`、ADR-0197（桌面生命週期）、ADR-0139（統一自訂對話框）

## 背景與問題

ADR-0197 的關閉提示以 `rfd` 原生 YesNo 對話框實作——彈出的是 **OS 原生視窗**，字體、按鈕樣式、配色都與 Cinderous 自訂無邊框 UI（`decorations:false`＋自製標題列）格格不入，且無法本地化到與 app 其餘文案一致。回報：關閉時的提醒彈窗應與介面風格一致。

專案內早有 `useDialog()`（ADR-0139）提供 `confirm/alert/prompt` 的 app 風格對話框，但只能在前端（WebView）觸發；`CloseRequested` 事件發生在 Rust 端，原本就地用 `rfd` 處理，沒有把決定權交回前端。

## 決策

**把關閉決策從 Rust 搬到前端，改用既有 `useDialog().confirm`。**

1. **Rust（`main.rs`）**：`CloseRequested` → `api.prevent_close()` 後 **`emit("app://close-requested")`** 交給前端，不再自行彈 `rfd`。新增兩個命令 `quit_app`（`app.exit(0)`）與 `hide_to_tray`（`window.hide()`），供前端依使用者選擇回呼；於 `invoke_handler` 註冊。
2. **前端（`App.tsx`）**：`useEffect` 內 `listen("app://close-requested")`（僅 `isTauri()`）→ 以 `confirm({ title, message, confirmLabel, cancelLabel })` 彈 app 風格框；確認＝`invoke("quit_app")`、取消＝`invoke("hide_to_tray")`。卸載時 `unlisten`。
3. **文案（i18n）**：新增 `close_title`／`close_message`／`close_quit`／`close_tray`（中英），語氣說明「縮到系統匣仍在背景收訊」與「直接結束」兩個選項。

## 理由

- 視覺一致＝重用同一套 `useDialog` 元件與主題變數，關閉框自然與 app 同風格、可完整本地化。
- 決策留在前端＝與其餘互動（`prompt`/`alert`）同層，日後要加「不再詢問」等選項也在同一處。
- Rust 只負責攔截與執行動作（結束／隱藏），前端只負責詢問＝關注點分離。

## 後果

- 正面：關閉提示與 app 介面一致、雙語、可測（前端可 mock `listen`/`invoke`）。移除 Rust 端 `rfd::MessageDialog` 用法（`rfd::FileDialog` 仍用於選檔／存檔，依賴保留）。
- 負面 / 已知殘餘風險：
  - 關閉流程現在跨 Rust↔前端一次 IPC；若 WebView 尚未就緒即收到關閉，理論上可能無框（實務上主視窗已載入才可能觸發關閉，風險極低）。
  - 仍每次都詢問（日後可加「不再詢問」偏好）。
  - Rust 原始碼改動＝強制 `main.rs` 重編譯 → `generate_context!` 重嵌目前 dist（延續 ADR-0197 治本慣例），本次隨 v0.0.8 重建重發。
- 後續：`quit_app`/`hide_to_tray` 命令亦可供未來系統匣選單或快捷鍵重用。

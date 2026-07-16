# 0152. 標題列拖曳改 pointer events＋⚙ 預設貼最小化左側（修正 0151）

- 狀態：已接受（已實作）
- 日期：2026-07-16
- 相關文件：**ADR-0151（本 ADR 修正其兩項決策）**、0104（原生檔案拖放——衝突根源）、0150（自繪外框）

## 背景與問題

ADR-0151 上線後實測發現兩個問題：

1. **設定頁的按鈕拖曳完全拖不動。** 根因：0151 用 HTML5 drag & drop（`draggable`），但
   Cinder 的 Tauri 視窗開著 `dragDropEnabled: true`（ADR-0104 原生檔案拖放依賴它）——
   在 Windows WebView2 上，Tauri 的原生拖放處理器會**攔截 webview 內的 HTML5 DnD 事件**
   （Tauri 已知限制），`dragstart` 根本不會發。關掉 `dragDropEnabled` 不可行（檔案拖放會壞）。
2. **⚙ 預設位置不符預期。** 0151 預設 ⚙ 獨佔左帶（Telegram 風）；使用者要求預設貼在
   「─ 最小化」左側（與視窗控制同一條右帶）。

## 決策

### 1. 拖曳改以 pointer events 自行實作（不碰 HTML5 DnD）

`setPointerCapture` 抓住被拖的 piece → `pointermove` 以 `document.elementFromPoint`
命中 `data-drop-side`（帶）/`data-piece`（插入點）做 hover 指示 → `pointerup` 落點放置
（`placeControl` 不變）。pointer capture 下 `pointerover` 不會發到其他元素，命中測試是
唯一正解；piece 加 `touch-action: none` 防觸控捲動搶事件。`draggable` 屬性移除
（留著可能觸發被吞的原生路徑）。

### 2. 預設與遷移：⚙ 貼最小化左側

- `DEFAULT_TITLEBAR_CONTROLS = { left: [], right: ["settings","min","max","close"], autoHide: false }`。
- v1（0150 `{side, order}`）遷移：⚙ 補在 order 帶**最前**（原「補對側」作廢）。
- 缺漏補回：⚙ 補右帶最前、其餘視窗控制補右帶尾。
- **0151 舊預設視為未自訂**：儲存值恰為「⚙ 獨佔左帶＋右帶 ─ □ ✕」→ 轉新預設
  （autoHide 為獨立偏好、照舊保留）；順序有動過＝使用者自訂，不碰。

## 後果

- 正面：拖曳在真桌面版（WebView2）實際可用；⚙ 預設貼視窗控制、不佔左端；插入點/目標帶
  有即時視覺指示（左緣色條/帶底色）。
- 已知限制／取捨：
  - 命中測試依賴 `document.elementFromPoint`（SSR 安全防呆：無 document 即 no-op）。
  - 「儲存值＝0151 預設即轉新預設」是啟發式——若使用者刻意擺出與 0151 預設一模一樣的
    配置會被轉走（再拖回去即可，成本一次拖曳；換取所有未自訂者無感升級）。
  - HTML5 DnD 於 Tauri webview 的限制記錄在案：日後任何 in-app 拖曳一律用 pointer events。

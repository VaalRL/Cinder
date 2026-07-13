# 0104. 原生檔案拖放（Tauri file-drop）——順帶修好「打包後拖放根本沒作用」

- 狀態：已接受（已實作）
- 日期：2026-07-13
- 相關文件：ADR-0093（檔案接收）、0102（縮圖＋讀回原圖）、0103（原生選檔取得送出端路徑）；
  `apps/desktop/src/native/file-drop.ts`、`apps/desktop/src-tauri/tauri.conf.json`

## 背景與問題

ADR-0103 讓「📎 選檔」走原生對話框、拿到真實路徑，但**拖放**仍走瀏覽器的 HTML5 `onDrop`
（`File` 物件，沒有路徑）。原本只打算補上路徑，查證時卻發現一個**更嚴重的問題**：

> **Tauri v2 的 `dragDropEnabled` 預設為 `true`** —— Tauri 會**攔截 OS 級拖放**，
> webview 裡的 HTML5 `onDragOver`/`onDrop` **根本不會觸發**。

也就是說：**打包後的桌面版，拖放傳檔本來就是壞的**——它只在瀏覽器開發預覽裡能用。
這個 bug 從 ADR-0017（P2P 檔案傳輸）以來一直存在，只是沒人在打包版上試過拖放。

## 決策

### 1. 接上 Tauri 的 `onDragDropEvent`

新增平台縫 `native/file-drop.ts`：`onNativeFileDrop({ onHover, onLeave, onDrop })`。
- 僅 Tauri 註冊；瀏覽器回 no-op（那邊 HTML5 拖放本來就能用，只是拿不到路徑）。
- Tauri 給的是**實體像素**座標 → 換算成 CSS 像素（`devicePixelRatio`）才能做 DOM 命中測試。

### 2. 命中測試：掉在哪個對話上？

原生拖放**只給座標**，不像 HTML5 有 `event.target`。故：
- 對話視窗根元素加 `data-convo={pubkey}`；
- 落點 → `document.elementFromPoint(x, y)` → `closest("[data-convo]")` → 該對話；
- **沒命中就送當前分頁**（三欄佈局的常見情境）。

### 3. 順帶：拖放也拿得到真實路徑

OS 拖放給的是**真實檔案路徑** → 複用 ADR-0103 的 `readFileAtPath()` 讀出位元組，
並比照帶入 `savedPath`。**拖進來的圖片，重載後也能看原圖。**

### 4. `dragDropEnabled: true` 寫進設定檔（明示）

它本來就是預設值，但**明示寫出來**——避免日後有人「清理」掉、或 Tauri 改預設值時
悄悄把這條路弄壞。`cargo check --features tauri-app` 會在編譯期驗證此設定檔的 schema。

## 理由

- 這條線不接，打包版的拖放**完全沒作用**——這比「拿不到路徑」嚴重得多，屬於必修。
- 命中測試靠 `data-convo` 屬性，而不是把座標映射邏輯散進各元件，改動集中且可測。
- 讀檔複用 ADR-0103 已有的 `readFileAtPath`／`read_saved_file`，**零新增原生能力**。

## 後果

- 正面：桌面打包版的拖放**首次真的能用**；拖進來的檔案也有 `savedPath`（可看原圖、可重新指定位置）。
  企業政策 `disableFiles` 一樣被尊重（拖放路徑也擋）。
- 負面 / 已知殘餘風險：
  - **此路徑無法在此環境端對端驗證**——需要實際 `tauri build` 後拖一個檔案進去才算數。
    這裡只驗到：TypeScript 型別、`cargo check --features tauri-app`（含 `tauri.conf.json` schema）、
    以及「`data-convo` 有渲染出來」的結構測試。命中測試與 `onDragDropEvent` 的實際行為**未經實機驗證**。
  - 拖放資料夾會被 `readFileAtPath` 讀成 null → 靜默略過（不會崩，但也沒有提示）。
  - 瀏覽器版仍走 HTML5 拖放（沒有路徑）——平台限制。
- 測試：desktop +1（對話視窗渲染 `data-convo=pubkey`，命中測試的前提）＝279。
  全 792 測試通過、typecheck 通過、`cargo check --features tauri-app` 通過。

# 0190. 修正簽章清單帶內發佈的 NIP-42 AUTH 缺口

- 狀態：已接受
- 日期：2026-07-18
- 相關文件：ADR-0039（簽章清單帶內發佈）、ADR-0057/0123（NIP-42 認證）、ADR-0188（維護者信任根）、ADR-0189（第二錨點）

## 背景與問題

啟用簽章池後首次實跑 `relay-health.yml`，探測全過、清單也簽出（kind 10037），但**帶內發佈兩座都失敗**（log `⚠ 發佈至 …`）。

根因：生產 relay 為 `requireAuth: true`，`relay-core.ts` 對 **EVENT 亦要求先做 NIP-42 AUTH**（未認證回 `["OK", id, false, "auth-required…"]`）。而 `health-check.ts` 的 `publishEvent` 在連線後**直接送 `["EVENT", …]`、未認證** → 被回 `OK false` → 發佈永遠失敗。探測 `conformance.ts` 早已修正為先 AUTH（故探測會過），但發佈這支漏了同樣處理。

影響：簽章清單有產出卻**送不進任何 relay**，客戶端學不到帶內清單（退回硬編錨點；連線不受影響，但「自動選座第三方 relay」未真正生效）。

## 考量的選項

- **選項 A（inline 複製 AUTH 握手到 publishEvent）**：可行但與 `conformance.ts` 重複 WS+AUTH 樣板。
- **選項 B（重用 `conformance.ts` 既有 helper）**：把 `withWs`/`autoAuth`/`parse` 匯出，`publishEvent` 改用之——與探測同一套、經實測可用。**採用**。
- AUTH 用臨時鑰 vs 維護者鑰：`handleEvent` 在公共站**不限制事件作者**（`allowed` 僅企業封閉模式），AUTH 只需證明握有某把鑰 → **臨時鑰即可**，與探測一致。

## 決策

`publishEvent` 改為**先 NIP-42 AUTH 再送 EVENT**，重用 `conformance.ts` 匯出的 `withWs`/`autoAuth`/`parse`：連線後若收到 `["AUTH", 挑戰]` 即以臨時金鑰回簽（`autoAuth`）；AUTH 成功（`OK` 非本事件 id）即發佈；不要求認證的中繼則 500ms 後直送（與 `conformance.ts` 同樣式）。移除未用的 `PROBE_TIMEOUT_MS`（改由 `withWs` 內建逾時）。

## 理由

- 重用探測已驗證可用的 WS+AUTH 樣板＝DRY、最小風險、行為一致。
- 依賴的契約「requireAuth 下 EVENT 需先認證」已由 `relay-core.test.ts` 覆蓋（未認證回 `OK false`、認證後可寫）；I/O 層（`publishEvent`）依專案慣例**以真實 workflow 重跑驗證**，不加 mock-WS 單元測試。

## 後果

- 正面：簽章清單可**帶內送達** requireAuth relay；客戶端（帶 `MAINTAINER_PUBKEY`、重建後）連上即學到。
- 負面 / 已知殘餘風險：
  - 500ms open-timer fallback 沿用 `conformance.ts` 樣式；認證握手需在其內完成（實測探測已證足夠）。
  - 臨時鑰認證仰賴「公共站不以作者限制寫入」——今日成立；企業封閉 relay（allowlist）本就不會被收錄進公共池，不受影響。
- 後續行動：重跑 `relay-health.yml` 確認 `📡 發佈至 …` 成功。

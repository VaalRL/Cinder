# 0177. 行動端企業模式・階段 C——公司儲存槽員工端（存入＋背景傳輸）

- 狀態：已接受（已實作）
- 日期：2026-07-17
- 相關文件：ADR-0161（公司儲存槽・選擇性存放＋離線排隊＋背景 P2P）、0093/0103（P2P 檔案／
  savedPath）、0173/0176（行動端企業身分）、行動版完整企業模式路線圖（A~D）

## 背景與問題

路線圖**階段 C**：讓企業員工從手機**主動選擇**檔案存入公司儲存槽。桌面（ADR-0161）作法：
佇列存 `savedPath`、傳輸時**以路徑重讀原檔**、企業主上線背景 P2P 送；且 `canDepositToSlot`
**限 `isTauri()`**——因為它依賴原生檔案路徑。行動端 web **沒有持久檔案路徑**，故無法照搬。

（企業主**接收/落盤**端仍是桌面：需寫檔＋`index.jsonl`＝原生檔案系統，行動端 web 沒有——路線圖
E，維持桌面。）

## 決策

### 1. 行動端佇列直接持有**位元組**（非路徑）

新增 `apps/mobile/src/slot-queue.ts`：`MobileSlotItem` 以 `bytes: Uint8Array` 取代桌面的
`path`。狀態轉換（enqueue/setStatus/remove/nextPending/retryFailed/activeCount）為純函式、可測。
**v1 為 session 內佇列（in-memory）**——企業主於本次 session 上線即背景傳；durable 化（OPFS）
為後續。

### 2. 存入入口：對話 🗄 鈕（企業成員限定）

`ConversationScreen` 加 `onDepositSlot?`（composer 🗄 鈕）；`MobileApp` 於
`selfEnterprise && selfAdmin && backend.depositFile` 才接上——**主動挑一個檔**（`pickFile`）
→ 入佇列，`origin`＝當下對話顯示名（供企業主端歸檔標註）。這是自主動作、非監控（ADR-0161 語意）。

### 3. 背景傳輸效果（鏡像桌面，去掉讀路徑）

`useEffect` 依 `[contacts, slotQueue, selfAdmin]`：企業主（`selfAdmin`，名冊採用後成為聯絡人）
**在線**且有 pending → `depositFile(admin, {name,mime,bytes}, origin)`（位元組已在佇列，**不需
async 讀檔**＝與桌面唯一差異）→ 標 done（已交 P2P）。`slotBusyRef` 防重入；換身分清空佇列。

## 後果

- 正面：企業員工可從手機**主動存檔進公司儲存槽**，企業主上線背景 P2P 直送（不經中繼儲存、
  企業主端靜默落盤不跳通知）。**員工端在手機上完全獨立**（消費＋入職＋存槽）到此齊備。
- 已知限制／取捨：
  - **v1 佇列為 session 內（in-memory）**：企業主須於本次 session 上線；App 關閉前未送出的
    存放會遺失（需重存）。durable 化（OPFS 持有位元組跨重啟）為後續。此為行動端 web 無持久
    路徑的直接結果（桌面靠路徑重讀＝天然 durable）。
  - **無佇列管理 UI**（重試/移除/進度）：v1 只做存入＋背景送；桌面有設定面板，行動端後續補。
  - **企業主接收/落盤仍在桌面**（原生檔案系統）：路線圖 E，維持桌面。
  - done＝已交 P2P（與桌面同語意，不追完成）。
- 路線圖 **C 完成**；接續 **D（企業主管理上手機）**。
- 測試：`slot-queue.test`（enqueue/nextPending/setStatus/remove/retry/activeCount 純函式）；
  `ConvoComposer.test` 補 🗄 鈕顯示/隱藏；mobile 177 綠燈、typecheck 通過（engine/desktop 未動）。

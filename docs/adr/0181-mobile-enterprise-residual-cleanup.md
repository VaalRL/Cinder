# 0181. 行動端企業模式殘留清理——儲存槽佇列 UI、企業成員鎖座、接管/刪除確認

- 狀態：已接受（已實作）
- 日期：2026-07-17
- 相關文件：ADR-0180（企業模式審查修正，列出這三項殘留）、0177（儲存槽員工端）、
  0176（per-identity 公司座）、0179（離職接管）、0034/0069（多中繼漫遊/搬家）

## 背景與問題

ADR-0180 審查列出三項非阻擋殘留，本 ADR 清掉：

1. 公司儲存槽員工端佇列**無管理 UI**：`done`/`failed` 項留在記憶體（`bytes` 無上限累積）、
   `failed` 無法重試。
2. 行動端企業**成員**仍帶 `anchors`/`connectorFor` 漫遊——桌面對企業成員刻意鎖單座（連公司
   自架 relay、不自動改道），行動端未鏡像。
3. 接管離職身分／刪除託管**無二次確認**（刪除不可逆＝丟失唯一金鑰備援）。

## 決策

### 1. 儲存槽佇列管理 UI ＋ done 釋放位元組

- `slot-queue.ts` 加 `completeSlot`：背景傳輸成功時標 `done` **並清空 `bytes`**（不再需要原始
  內容，避免佇列吃記憶體）；`failed` 走 `setSlotStatus`（保留 bytes 供重試）。
- 設定頁新增「公司儲存槽」佇列區（員工有排隊項才顯示）：逐項狀態＋移除；有失敗項才顯示「重試」
  （`retryFailed`）。與桌面設定面板對等。

### 2. 企業成員鎖定公司座（鏡像桌面 `buildBackend`）

`createRelayChat`：`opts.org?.enterprise`（**成員**）為真時**不帶** `connectorFor`/`anchors`/
`maintainerPubkey`——只連公司座、不漫遊、不遞補、不學錨點（否則收不到名冊、且把企業裝置心跳
洩漏到公司外的公開座）。**企業主（orgOwner）與個人身分照舊漫遊保命**（owner 是一般身分＋標記）。

### 3. 接管/刪除二次確認

新增 `confirmAction(key)`（無 `window.confirm` 時照做、有則需確認；`removeContact` 一併改用）。
`takeoverOffboarded`（`offboard_takeoverConfirm`）與 `deleteEscrow`（`offboard_deleteConfirm`，明講
不可逆）於執行前確認。

## 後果

- 正面：儲存槽佇列可見可管（記憶體不再無上限累積）；企業成員嚴格鎖公司座（收得到名冊、不外洩
  心跳）；破壞性操作有確認。三項殘留清空。
- 已知限制／取捨：
  - 佇列仍 session 內（durable OPFS 為更後續，ADR-0177 已記）——本 ADR 只補管理 UI 與記憶體釋放。
  - 企業成員鎖座後，若公司座長期不可用＝該身分斷線（不自動改道）——這正是「鎖定」的取捨，
    與桌面一致（企業成員本就該只在公司座）。
- 測試：`slot-queue.test` 補 `completeSlot`（done 釋放 bytes、failed 保留）；`MobileApp.test` 補
  設定頁佇列區渲染（項目/移除/重試）；mobile 192＋i18n 8 綠燈、三端 typecheck 通過。

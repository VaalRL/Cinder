# 0035. Relay hint 自動學習：帶內加密 hint（否決 NIP-65 公開清單）

- 狀態：已接受
- 日期：2026-07-02
- 相關文件：docs/adr/0034（多中繼路由）、packages/core/src/giftwrap.ts、
  apps/desktop/src/backend/relay-backend.ts

## 背景與問題

ADR-0034 的 relay hint 靠加好友時手動交換（`npub…@wss://…`）。被動加入的
一方（收到陌生私訊自動建立聯絡人）沒有 hint：訊息仍可經 pool 收件箱收到、
也看得到對方在線（心跳全 pool 扇出），但回程路由退回自己的 home、
且看不到對方 presence——需要 hint 的自動學習來恢復對稱。

## 考量的選項

1. **NIP-65（kind 10002 公開 relay 清單）**：生態標準，但把「我用哪座
   relay」以明文事件公開發布——任何人可查詢任何 pubkey 的 relay 歸屬，
   直接洩漏本專案刻意以 Gift Wrap 隱藏的 metadata；且需要 relay 支援
   replaceable 事件（自家 MessageStore 未實作）。
2. **帶內加密 hint**：寄件人把自己的 home relay 寫進 **rumor 內層**
   `relay` tag——經 NIP-44 加密、藏在 Gift Wrap 裡，只有收件人解得開；
   寄件人身分已由 NIP-59 開封驗證，hint 即為「經驗證的本人自述」。

## 決策

採 **選項 2**：

- **送**：`wrapMessage` 的 `WrapOptions` 加 `relayHint?`，寫入 rumor tag
  `["relay", url]`；後端送 1:1 訊息時自動帶上自己的 home relay。
  （群訊 rumor 目前不帶；學習端讀任意 rumor 的 `relay` tag，未來群訊
  帶上即自動生效。）
- **學**：`relayHintOf(rumor)` 讀出 hint；後端解開私訊後，若正規化後
  與現存 hint 不同即更新該聯絡人（`AppStorage.updateContactRelay`），
  並觸發 resubscribe（pool 新座自動連線）。與自己 home 相同時存為
  「無 hint」（等價路由）。
- **信任模型**：hint 在加密信封內、寄件人已驗證——等同對方親口告知；
  惡意聯絡人謊報只影響「發給他自己的訊息」的路由，無放大面。中繼站
  與第三方全程看不到任何人的 relay 歸屬。

## 後果

- 正面：不對稱認知在**第一則來訊後自癒**（回程直達對方 relay、
  presence 訂閱補上）；零公開 metadata；relay 端零改動。
- 負面：學習只在收到訊息時發生（未通訊過的聯絡人仍需手動 hint）；
  對方換 relay 後，舊 hint 要等下一則來訊才更新（期間靠 pool 收件箱
  與心跳全扇出兜底）。
- 後續：群訊 rumor 帶 hint；hint 陳舊偵測（多座長期離線時提示）。

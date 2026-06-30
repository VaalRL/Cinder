# 0007. NIP-44 加密採用 nostr-tools，事件/簽章維持自有 core

- 狀態：已接受
- 日期：2026-06-30
- 相關文件：docs/adr/0004；PRD.md §7；ARCHITECTURE.md §5

## 背景與問題

M2 離線留言需要 NIP-44 v2 加密與 NIP-17/59 Gift Wrap。NIP-44 v2 涉及 secp256k1 ECDH → HKDF → ChaCha20 + HMAC-SHA256 與特定 padding，**自行手刻資安關鍵密碼學風險高且難以對齊官方測試向量**。ADR-0004 已預先授權「必要時局部引用 nostr-tools」。

## 決策

- **NIP-44 加解密的密碼學原語直接採用 `nostr-tools` 的 `nip44` 模組**（其底層為審計過的 `@noble`）。在 `packages/core` 以薄包裝 `encryptDM`/`decryptDM` 暴露，輸入沿用本專案金鑰型別（私鑰 `Uint8Array`、公鑰 hex）。
- **事件建構、序列化、event id、Schnorr 簽章/驗章維持本專案 `core` 自有實作**（T1–T3）為單一 SSOT。
- **NIP-59 Gift Wrap（kind 13 seal、kind 1059 wrap）由 core 自行用上述 `finalizeEvent` + `encryptDM` 組合**，不引入 nostr-tools 的事件層，避免事件處理出現雙重 SSOT。

## 理由

資安關鍵密碼學交給審計過、生態共用的實作可降低風險並確保互通；事件層維持自有以守住 SSOT 與低階控制力。兩者邊界清楚：nostr-tools 只負責「cipher」，core 負責「event」。

## 後果

- 正面：NIP-44 互通性與安全性有保障；不手刻密碼學。
- 負面：core 新增一個執行期相依（nostr-tools）；需確保僅用其 nip44（及必要時 nip19/nip44 向量），不擴散到事件層。
- 後續行動：實作 `nip44.ts` 包裝與測試；後續以 core 自有方式組裝 NIP-17/59 Gift Wrap。

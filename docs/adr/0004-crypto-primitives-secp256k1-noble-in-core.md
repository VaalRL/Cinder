# 0004. 加密原語：secp256k1（@noble）收斂於 packages/core

- 狀態：已接受
- 日期：2026-06-30
- 相關文件：PRD.md §4、§7；ARCHITECTURE.md §3、§4、§8；docs/adr/0002

## 背景與問題

原始 PRD/ARCHITECTURE 全篇以 **Ed25519** 描述身分金鑰與簽章。但 Nostr（NIP-01）強制使用 **secp256k1 + BIP-340 Schnorr 簽章**，`npub` 為 secp256k1 公鑰，NIP-44 加密亦採 secp256k1 ECDH。若採 Ed25519 將**完全無法與任何 Nostr relay 互通**。同時需決定加密邏輯實作於何處與用哪套函式庫（ARCHITECTURE §8 待決議）。

## 考量的選項

- 曲線：Ed25519（與 Nostr 不相容，排除）vs **secp256k1**（NIP-01 標準）。
- 實作位置/函式庫：TS `@noble/curves`+`@noble/hashes` 收斂於 `packages/core`；直接用 `nostr-tools`（封裝較高）；或 Rust 端（`k256`）為主（Worker/前端需另一份實作）。

## 決策

- **曲線一律 secp256k1**，簽章採 BIP-340 Schnorr，修正全文件的 Ed25519 表述。
- 金鑰生成、簽章/驗章、event id（sha256）、NIP-44 加解密與 NIP-19 bech32 編碼，**以 `@noble/curves`/`@noble/hashes` 在 `packages/core` 實作為單一 SSOT**，桌面前端與 Worker 共用同一份；Rust/Tauri 僅負責安全儲存與背景連線，不重造加密。

## 理由

secp256k1 是 Nostr 的硬性要求，無選擇空間。`@noble` 系列為審計過、零依賴、跨環境（瀏覽器/Node/Worker）一致的實作，相容 `packages/core` 的單一 SSOT 原則；不選 `nostr-tools` 是為了在自訂 NIP-44/17 細節時保有低階控制力（其底層同樣是 noble，必要時仍可局部引用）。

## 後果

- 正面：與 Nostr 生態相容；加密邏輯單一來源、跨平台一致、可獨立單元測試。
- 負面：Rust 端若未來需離線驗章，仍須謹慎對齊同一套規則（以 core 的測試向量為準）。
- 後續行動：修正 PRD/ARCHITECTURE/README/AGENTS/claude 指南中的 Ed25519 表述（已完成）；於 core 實作 T1–T3 並建立跨實作測試向量。

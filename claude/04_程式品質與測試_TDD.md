# 04｜程式品質與測試（TDD）

## 指南

- 功能程式碼遵循 **Red -> Green -> Refactor**
- 純文件修改可不新增測試，但不可讓文件與架構失真
- 關鍵路徑優先測：Nostr 事件建構/簽章/驗證、加密解密、連線狀態判定與訊息收發
- 共用測試資料請抽成 fixture，不要在各層重複造資料

## 分層測試要求

- **共用核心 / Nostr 與加密邏輯（packages/core）**
  - 驗證事件建構、簽章與驗章（secp256k1 Schnorr / BIP-340）
  - 驗證加解密（NIP-44；多設備同步 AES-256-GCM）與 SQLite schema 行為
  - 驗證 Kind 對應與心跳/過期（NIP-40）邏輯

- **Rust / Tauri Bridge**
  - 驗證 SQLite 讀寫與本機持久化
  - 驗證 WebSocket 連線、重連、timeout、fallback
  - 驗證 WebRTC 資料通道建立與錯誤對映

- **UI / React**
  - 驗證上線/離線狀態渲染與好友列表
  - 驗證對話視窗收發與 Nudge 互動

- **Worker / 中繼站**
  - 驗證 Ephemeral 純轉發（不寫 D1）
  - 驗證離線留言寫入與 NIP-40 過期銷毀

## 完成定義（DoD）

- 測試通過，或明確記錄目前只能做的 PoC 驗證方式
- 未新增重複來源，且有延伸既有設計
- 若 Nostr 事件契約、加密策略或資料流改動，文件同步更新

# 0017. WebRTC P2P 檔案傳輸整合（Phase A4）

- 狀態：已接受
- 日期：2026-07-01
- 相關文件：docs/ROADMAP.md（Phase A4）；docs/adr/0008（WebRTC 信令與資料通道協定）；ARCHITECTURE.md §5

## 背景與問題

Phase A4 要把既有、已測試的 core `signaling` / `datachannel` 模組接進桌面聊天 UI，讓使用者能直接傳檔。檔案不應經中繼（省流量、不受 JSON 大小限制、內容不落中繼），而走 P2P。

## 決策

- **傳輸管理器**：新增 `apps/desktop/src/backend/webrtc.ts` 的 `WebRtcTransfer`——**每聯絡人一條** `RTCPeerConnection`，複用 core 的 `createSignal`/`readSignal`（NIP-59 包封的 kind 21000 ephemeral 信令）與 `encodeFile`/`DataChannelReceiver`。發起者建立 datachannel 並送 offer；收件端於 `ondatachannel` 取得同一條通道（雙向）。ICE candidate 於 `setRemoteDescription` 前緩衝，避免過早 `addIceCandidate`。
- **背壓與進度**：送檔以 pump 迴圈送出分塊，`bufferedAmount` 超過 1 MiB 即暫緩；以位元組回報進度（`onFileProgress`）。收檔完成以 `onFileReceived` 交出 `ReceivedFile`。
- **與中繼後端整合**：`RelayChatBackend` 訂閱 `#p` 自己的 21000 信令並路由給管理器；新增 `sendFile(to, file)`。**收檔時先 `ensureContact(sender)`**（與 `receiveDm` 對稱），否則對話視窗因查無聯絡人而無法呈現；被封鎖者的檔案一律丟棄。`stop()` 關閉所有 PC。
- **UI**：對話視窗加附件鈕（📎）與拖放區；檔案以卡片呈現（名稱、大小、送出進度條 / 收檔下載連結，收檔以 `Blob` + object URL 下載）。

## 後果

- 正面：檔案走 P2P（DTLS 加密），不經中繼；沿用已測試的 core 純函式（`encodeFile`/`DataChannelReceiver` 有單元測試）。整條路徑經**真實 relay + 真實 WebRTC**兩瀏覽器 context E2E 驗證（50 KB 檔案位元組完全一致）。
- 負面 / 未來：目前無 STUN/TURN 設定（`rtcConfig` 可注入但預設空），僅靠 host candidate——同網段/本機可通，跨 NAT 需補 STUN/TURN（對應 ADR-0008 的降級與 `FILE_TRANSPORT_ORDER`，Phase C/部署時設定）。glare（雙方同時 offer）目前以單發起者假設處理，罕見情境未特別化解。收檔端無逐塊進度（`DataChannelReceiver` 未回報），僅「接收中→完成」。多檔佇列逐一送出。E2E 需以 `--disable-features=WebRtcHideLocalIpsWithMdns` 讓跨 context ICE 於容器內連通（測試環境設定，非產品行為）。

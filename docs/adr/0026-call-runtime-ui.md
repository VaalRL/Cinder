# 0026. 通話執行期與 UI（M8）

- 狀態：已接受
- 日期：2026-07-01
- 相關文件：docs/adr/0025（通話信令核心）、docs/adr/0017（WebRTC 檔案傳輸）；ROADMAP M8

## 背景與問題

在 M8 信令核心（ADR-0025 的 `CallSession` 狀態機）之上，接上真實
`RTCPeerConnection` + `getUserMedia` 與通話 UI，完成可實際撥打的語音/視訊通話。

## 決策

- **執行期 `WebRtcCall`（前端）**：把 `CallSession` 回傳的 `CallAction` 落實到真實
  WebRTC——`acquire-media`→`getUserMedia`、`create-offer/answer`→`createOffer/Answer`
  + `setLocalDescription` 後以 `localDescription()` 回饋、`set-remote`→
  `setRemoteDescription`（含 ICE candidate 緩衝）、`send`→`createCallSignal` 發布。
  `pc.ontrack` 取遠端串流、`onicecandidate` 送 `call-candidate`、`connectionState`
  connected→`onConnected()`。單一通話槽，忙線由執行期直接回 busy 給邀請者。
- **傳輸**：控制與 candidate 皆走 kind 21002（NIP-59 ephemeral），與資料通道
  SDP(21000) 區隔；媒體全程 P2P（DTLS 加密），不經中繼。
- **後端接線**：`RelayChatBackend` 訂閱 21002、路由至 `WebRtcCall`，並以
  `ChatBackend` 介面暴露 `startCall/acceptCall/rejectCall/hangupCall` 與事件
  `onCallState/onCallLocalStream/onCallRemoteStream`（UI 不需知道 WebRTC 細節）。
- **UI `CallWindow`**：依狀態呈現撥號/來電（接聽/拒接）/連線中/通話中（計時、靜音、
  掛斷）；視訊顯示遠端大畫面 + 本端小視窗，語音以隱藏 `<audio>` 播放遠端聲音。對話
  視窗標題列加 📞/🎥 發起鈕。

## 後果

- 正面：完成可實際撥打的通話。以 Chromium 假音源 + 真實 relay + 真實 WebRTC 端到端
  驗證一通語音通話：**發起→響鈴→接聽→雙方 active→雙向遠端音訊軌建立→掛斷關閉**。
  站在 ADR-0025 已測狀態機之上，執行期僅負責 I/O 落實。
- 負面 / 未來：尚無 TURN 保底（對稱 NAT 需補，沿用檔案傳輸的 `rtcConfig` 注入點）、
  無來電鈴聲/系統通知、無通話中切換視訊、無多方通話；離線對象無法接通（P2P 需雙方
  在線）。視訊 UI 已具備但主要以語音路徑驗證（假視訊裝置亦可）。

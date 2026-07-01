# 0025. 語音/視訊通話信令核心（M8）

- 狀態：已接受
- 日期：2026-07-01
- 相關文件：docs/ROADMAP.md（Phase E / M8）；docs/adr/0008（WebRTC 信令與資料通道）；PRD §12、ARCHITECTURE §5

## 背景與問題

M8 通話需要一套「通話控制」信令與生命週期管理（響鈴、接聽、拒接、忙線、掛斷），
且要沿用既有隱私機制、可在無真實媒體環境驗證，並與資料通道信令（檔案/Nudge 的
offer/answer/candidate）清楚區隔。

## 決策

- **政策與 I/O 分離**（延續 B3 模式）：`call.ts` 的 `CallSession` 是**純狀態機**，
  掌管通話生命週期（`idle/outgoing/incoming/connecting/active/ended`），回傳
  `CallAction`（`acquire-media`/`create-offer`/`create-answer`/`set-remote`/`send`/
  `ended`/`close`）由執行期（RTCPeerConnection + getUserMedia）落實，本端 SDP 以
  `localDescription()` 回饋。
- **通話控制信令**：`call-invite`（含 media + offer SDP）/`call-accept`（answer SDP）/
  `call-reject`（declined|busy）/`call-hangup`。ICE candidate 不進狀態機，由執行期走
  既有 candidate 路徑。
- **獨立 kind**：通話控制走 **kind 21002** 的 NIP-59 ephemeral Gift Wrap（隱藏「誰
  呼叫誰」），與資料通道 SDP（21000）區隔，利於訂閱與路由。`createCallSignal`/
  `readCallSignal`/`parseCallSignal` 提供傳輸與信任邊界檢查。
- **語意**：忙線時對新 invite 回 `busy` 且不影響現有通話；不相干 `callId` 一律忽略；
  拒接/掛斷雙向對稱。

## 後果

- 正面：通話信令核心**在此環境完全可驗證**——11 個單元測試涵蓋主叫/被叫完整流程、
  拒接、忙線、雙向掛斷、glare（忽略他人 callId），以及**兩端經真實加密
  `createCallSignal→readCallSignal` 完成握手直到雙方 active**。與既有 NIP-59/隱私機制
  一致。
- 負面 / 未來：尚未接 `RTCPeerConnection`/`getUserMedia` 執行期與通話 UI（響鈴、接聽/
  拒接、靜音/掛斷、遠端串流呈現）——媒體屬 M8 另一半，需相機/麥克風（可以假裝置做
  E2E）。多方通話（SFU/mesh）與通話中新增視訊等留待後續。

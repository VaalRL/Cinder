# ARCHITECTURE.md — Nostr Buddy 系統架構（草稿）

> 本文件是模組邊界、資料流與初始化規劃的**單一真實來源（SSOT）**。產品行為以 [`PRD.md`](./PRD.md) 為準；本文件定義「落在哪一層、如何連接」。
>
> 狀態：**草稿（M0）**。隨實作推進，模組邊界、事件契約或資料流如有變更，必須同步更新本檔與相關入口文件。

## 1. 設計原則

- **本地優先（Local-First）**：本機 SQLite 是唯一真相來源；網路層只負責同步與轉發。
- **零伺服器狀態**：中繼站不持久化線上狀態與信令（Ephemeral），僅暫存有過期時間的離線留言。
- **端到端加密**：明文不離開裝置；中繼站只看得到密文。
- **雙軌動態切換**：能 P2P 直連就走 WebRTC；不能直連或對方離線時退回 Nostr 中繼。

## 2. 雙軌混合網路

```text
        ┌─────────────────────────────┐         ┌─────────────────────────────┐
        │        裝置 A（桌面）        │         │        裝置 B（桌面）        │
        │  React UI ── Tauri(Rust)     │         │  React UI ── Tauri(Rust)     │
        │   │            │             │         │             │          │   │
        │  SQLite(SSOT)  金鑰/加密      │         │       金鑰/加密  SQLite(SSOT) │
        └───────┬────────────┬─────────┘         └────┬────────────┬──────────┘
                │            │                         │            │
   引擎 A：Nostr │            │ 引擎 B：WebRTC P2P       │            │ 引擎 A：Nostr
   (WebSocket)  │            └─────────────────────────┘            │ (WebSocket)
                │              即時：Nudge / 檔案 / 動畫              │
                ▼                                                    ▼
        ┌──────────────────────────────────────────────────────────────┐
        │              Cloudflare Worker（Nostr Relay）                  │
        │  Ephemeral(20000-29999)：純記憶體轉發，不寫 D1                  │
        │  離線留言(Kind 4/44)：寫入 D1，押 NIP-40 7 天過期，定時銷毀      │
        └──────────────────────────────────────────────────────────────┘
```

- **引擎 A — Nostr（Cloudflare Workers + D1）**：離線留言暫存、線上狀態廣播、WebRTC 初始 SDP 信令交換。
- **引擎 B — WebRTC（P2P）**：雙方上線並完成 SDP 交換後打通資料通道，後續即時互動繞過中繼站。

## 3. 模組與目錄落點

| 模組 | 目錄 | 職責 |
| --- | --- | --- |
| 共用核心 | `packages/core/` | Nostr 事件建構/驗證、加密（Ed25519 簽章、AES）、SQLite schema 與型別、事件 Kind 常數。跨平台共用，**SSOT 邏輯所在**。 |
| 桌面前端 | `apps/desktop/src/` | React/TS UI：好友列表、對話視窗、狀態列、Nudge 動畫。 |
| 桌面原生橋 | `apps/desktop/src-tauri/` | Rust：原生 SQLite 讀寫、背景 Nostr WebSocket 長連線、WebRTC 資料通道、金鑰安全儲存、IPC。 |
| 行動端 | `apps/mobile/`（預留） | React Native + SQLite；Silent Push 喚醒背景同步。 |
| 中繼站 | `relay/` | Cloudflare Worker + D1：Nostr relay，處理 Ephemeral 轉發與 NIP-40 過期留言。 |
| 測試 | `tests/` | 跨層整合測試與共用 fixture。 |
| 文件 | `docs/` | 設計決策與流程補充。 |

> 分層原則：TS 共用邏輯一律收斂到 `packages/core/`，不要在 UI 與 Worker 各自重造一份 Nostr/加密邏輯（避免多重 SSOT）。

## 4. 身分與資料模型

- **身分**：首次啟動生成 Ed25519 金鑰對；公鑰 `npub` 為全網唯一 ID。私鑰寫入本機安全儲存，**絕不離開裝置、無雲端備份**。
- **SQLite（SSOT）**：好友（npub、顯示名稱、上線狀態）、對話訊息（明文僅存本機）、金鑰、設定。對外傳輸前一律加密。
- **多設備同步**：QR Code 僅含「一次性 AES 金鑰 + 內網 IP + WebRTC 房間號」；手機端以 **Happy Eyeballs（RFC 8305）** 同時發起 LAN 直連與 WAN 打洞，優先連通者整包加密傳輸 SQLite 與私鑰。

## 5. 事件契約（Nostr Kind 對照）

| 功能 | Kind | 持久化 | 機制 |
| --- | --- | --- | --- |
| 離線文字留言 | 4 / 44 | D1（NIP-40，7 天過期） | 本機私鑰加密後存中繼，對方上線拉取解密 |
| 好友上線/離線 | 20000 | 否（Ephemeral） | 每 30 秒心跳；斷線 60 秒判離線 |
| 正在聆聽音樂 | 20000 | 否（Ephemeral） | 系統 API 狀態字串廣播 |
| 正在輸入中 | 20001 | 否（Ephemeral） | 對話視窗觸發，中繼轉發 |
| WebRTC SDP 交換 | 20000-29999 | 否（Ephemeral） | 信令交換，純記憶體轉發 |
| 震動（Nudge） | — | — | WebRTC Data Channel，需 P2P 連線 |
| 檔案傳輸 | — | — | WebRTC Data Channel，不受 JSON 大小限制 |

## 6. 第一個功能（M1）：Nostr 中繼連線與心跳

**目標資料流**：

```text
本機金鑰 ──簽署──> Kind 20000 心跳事件 ──WebSocket──> Cloudflare Relay
                                                          │（Ephemeral：純轉發，不寫 D1）
好友端 UI <── 渲染上線狀態 <── 訂閱接收 <───────────────────┘
（每 30 秒一次心跳；連續 60 秒未收到即判定離線）
```

**範圍**：relay WebSocket 連線管理、最小 Ed25519 簽章、Kind 20000 心跳發送與訂閱、上線/離線狀態判定與 UI 渲染。
**依賴**：最小金鑰生成（簽章用）。完整身分流程與多設備同步屬後續里程碑。

## 7. 里程碑

- **M0**：文件與專案骨架（本次初始化）。
- **M1**：Nostr 中繼連線與心跳（含最小金鑰簽章、上線/離線狀態）— **預設先做**。
- **M2**：離線文字留言（Kind 4/44、NIP-40 過期）。
- **M3**：WebRTC P2P 直連（SDP 信令、Nudge 震動、檔案傳輸）。
- **M4**：多設備同步（QR Code + Happy Eyeballs）。
- **M5**：經典體驗還原（音樂狀態、正在輸入中）與行動端。

## 8. 待決議（Open Questions）

- 中繼站採自建 Worker relay 還是相容既有 Nostr relay 實作？
- `packages/core` 的加密原語選型（Web Crypto vs Rust 端 `ring`/`ed25519-dalek`）與跨平台一致性策略。
- monorepo 工具（pnpm workspace / turborepo）與行動端共用程度。

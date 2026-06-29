# Nostr Buddy

> 去中心化、無中央資料庫的即時通訊軟體。融合 **Nostr 協議** 與 **WebRTC**，高度還原早期 MSN Messenger 的經典互動體驗（震動、音樂狀態、離線留言），並以「零伺服器維護成本」為營運目標。

## 簡介

Nostr Buddy 透過「狀態信令」與「巨量資料傳輸」雙軌混合網路，達成極致隱私與低延遲：

- **零知識身分**：首次啟動於本機生成 Ed25519 金鑰對，公鑰（`npub`）即為全網唯一 ID，無帳號密碼。
- **純本機資料庫**：以本機 SQLite 作為唯一真相來源（SSOT），對話與金鑰永不上雲，為未來本地 AI（RAG 摘要）預留封閉環境。
- **端到端加密**：訊息以本機私鑰加密後才離開裝置。
- **零責任歸屬**：不提供助記詞或雲端備份；設備與本機資料庫全毀即代表帳號永久死亡。

## 技術架構摘要

雙軌混合網路（依連線狀態動態切換）：

| 引擎 | 技術 | 定位 |
| --- | --- | --- |
| **引擎 A：狀態與信令** | Nostr 協議（Cloudflare Workers + D1） | 離線留言暫存、線上狀態廣播、WebRTC 初始 SDP 信令交換 |
| **引擎 B：巨量資料傳輸** | WebRTC 直連（P2P） | 即時互動：震動（Nudge）、動畫快遞、大檔案傳輸，繞過中繼站達成毫秒級延遲 |

資料生命週期靠 **NIP-40**（7 天過期）與 **Ephemeral Events**（Kind 20000-29999 純記憶體轉發、不寫資料庫），確保 Cloudflare 永久免費額度不被耗盡。

### 終端平台

- **桌面端（第一優先）**：Rust **Tauri** + **React/TypeScript**。背景 WebSocket 長連線 + 原生 SQLite 持久化。
- **行動端（輔助）**：**React Native** + SQLite。透過 Cloudflare Worker 的無聲推播（Silent Push）喚醒背景同步。
- **網頁版**：刻意捨棄（瀏覽器會靜默清空 IndexedDB，在無中央備份下將造成不可挽回的資料遺失）。

完整技術規格見 [`PRD.md`](./PRD.md)，模組邊界與資料流見 [`ARCHITECTURE.md`](./ARCHITECTURE.md)。

## 專案結構

```text
.
├── apps/
│   ├── desktop/        # Tauri + React + TypeScript（第一優先平台）
│   │   ├── src/        # React/TS 前端 UI
│   │   └── src-tauri/  # Rust：SQLite、Nostr WebSocket、WebRTC、金鑰管理
│   └── mobile/         # React Native + SQLite（輔助平台，預留）
├── packages/
│   └── core/           # 共用 TS：Nostr 事件、加密、SQLite schema、型別
├── relay/              # Cloudflare Worker + D1（Nostr 中繼站）
├── tests/              # 跨層測試與 fixture
├── docs/               # 設計決策補充
└── claude/             # AI 協作規範與開發指南
```

> 目前處於 **M0（文件與骨架）** 階段，`apps/`、`packages/`、`relay/` 為預留結構，尚未放入套件設定與程式碼。

## 開發指令

> 套件管理檔（`package.json`、`Cargo.toml` 等）將於進入實作時建立。下列為規劃中的核心指令。

| 任務 | 指令（規劃） |
| --- | --- |
| 桌面端開發 | `pnpm --filter desktop tauri dev` |
| 桌面端建置 | `pnpm --filter desktop tauri build` |
| 共用核心測試 | `pnpm --filter core test` |
| Rust 測試 | `cargo test`（於 `apps/desktop/src-tauri/`） |
| 中繼站本地開發 | `wrangler dev`（於 `relay/`） |
| 中繼站部署 | `wrangler deploy`（於 `relay/`） |

## 開發規範

本專案採 AI 協作開發，硬規則如下（詳見 [`CLAUDE.md`](./CLAUDE.md)、[`gemini.md`](./gemini.md) 與 [`claude/`](./claude)）：

- **單一真實來源（SSOT）**：產品需求看 `PRD.md`，模組與資料流看 `ARCHITECTURE.md`。
- **Architecture First / Search First**：先定位模組、再讀現有實作、最後才動手。
- **Fix First**：延伸既有設計，不建立 `v2`、`new_*`、`*_enhanced` 平行路徑。
- **TDD**：功能程式碼遵循 Red → Green → Refactor，測試即文件。
- **本地優先與低延遲**：任何變更都不得破壞訊息即時性與隱私預設。

## 授權

待補。

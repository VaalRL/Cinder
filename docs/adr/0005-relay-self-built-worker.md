# 0005. 中繼站：自建最小 Cloudflare Worker relay

- 狀態：已接受
- 日期：2026-06-30
- 相關文件：PRD.md §2、§8、§9；ARCHITECTURE.md §2、§6、§8；docs/adr/0002

## 背景與問題

M1 需要 Nostr 中繼站轉發心跳。選項是自建 Worker relay、先接既有公開 relay，或改造既有實作（如 strfry）。ARCHITECTURE §8 將「自建 vs 既有」列為待決議。本專案對中繼站有客製需求：NIP-40 過期、Ephemeral 純轉發不寫 D1、後續 NIP-42/13 防濫用、以及 Cloudflare 免費額度成本控制。

## 考量的選項

- 自建最小 Worker relay：完全掌控，與 Cloudflare Worker + D1 架構天然契合。
- 先接公開 Nostr relay：最快看到 client 端到端效果，但無法驗證自家 Ephemeral/成本策略，且把隱私託付第三方。
- 改造既有實作（strfry 等）：功能完整，但偏離 Worker + D1 免費架構，部署模型不同。

## 決策

**自建最小 Cloudflare Worker relay**。M1 先實作 WebSocket 協定（`EVENT`/`REQ`/`CLOSE`）與 Ephemeral（20000-29999）純記憶體扇出、不寫 D1；NIP-40 留言持久化與 NIP-42/13 防濫用留待 M2 與容量定案後加入。

## 理由

中繼站的客製需求（Ephemeral 行為、免費額度成本控制、後續防濫用）是產品核心，遲早要自建，及早掌控可避免日後遷移。最小化首版範圍以先打通 M1 心跳。

## 後果

- 正面：架構一致、可控、隱私不外包。
- 負面：需自行確保 Nostr 協定相容性（以 core 的事件/簽章測試向量交叉驗證）。
- 後續行動 / 待決議：**Ephemeral 心跳的 Worker 請求容量估算**（免費層 ~10 萬請求/日；扇出 = 在線好友數 × 心跳頻率 × 訂閱者數）須於 M1 完成前定案並另立 ADR，據以決定心跳間隔/合併/抖動策略。

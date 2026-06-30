# 0003. Monorepo 工具採用 pnpm workspace

- 狀態：已接受
- 日期：2026-06-30
- 相關文件：ARCHITECTURE.md §3、§8

## 背景與問題

專案為 monorepo，含 `packages/core`（共用 TS）、`apps/desktop`（Tauri + React）、`apps/mobile`（預留）、`relay`（Cloudflare Worker）。需選定 workspace 與腳本管理工具。ARCHITECTURE §8 將此列為待決議。

## 考量的選項

- pnpm workspace：最輕量，原生支援 workspace 協定與硬連結節省磁碟。
- pnpm + Turborepo：加任務編排與建置快取，設定較多。
- Nx：功能最全（產生器、相依圖、快取），學習曲線與設定最重。

## 決策

採用 **pnpm workspace**。

## 理由

現階段套件數少（3+1），pnpm workspace 已足以管理跨套件相依與腳本；快取/任務編排的效益要等套件與建置時間成長後才顯著。保留日後疊加 Turborepo 的空間，避免一開始就背負過重設定。

## 後果

- 正面：上手快、設定少、磁碟省。
- 負面：跨套件平行建置/快取需自行以 npm scripts 串接，規模變大後可能需再導入 Turborepo（屆時另立 ADR）。
- 後續行動：建立 `pnpm-workspace.yaml` 與根 `package.json` workspace 腳本。

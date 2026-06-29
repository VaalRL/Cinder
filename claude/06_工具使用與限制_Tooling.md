# 06｜工具使用與限制（Tooling）

## 搜尋與閱讀

- 搜尋檔案：優先用 `fd`
- 搜尋內容：優先用 `rg`
- 讀取前先定位，不要盲目全檔掃描
- 修改前先讀上下文，避免覆蓋未理解的內容

## 專案相關工具原則

- Rust / Tauri 任務：以 `cargo`、`tauri` 為主
- 前端任務：以既有 package manager 為主，不要先假設是 `npm`、`pnpm` 或 `yarn`
- 中繼站任務：以 `wrangler`（Cloudflare Worker）為主
- 網路驗證：優先用 mock relay / fixture，不要把 live relay 或實機 P2P 打洞當基本測試
- 通訊流程驗證：優先做最小 PoC，再擴大到整合測試

## 限制

- 不要使用互動式 git 流程
- 不要對 repo 外的使用者本機資料庫、金鑰或設定做破壞性修改
- 若 manifest 尚未建立，不要在文件中假裝某條命令已經可用
- 若需要實機網路驗證（relay / WebRTC 打洞），應先完成本地抽象與 fallback

## 推薦工具對照

| 任務 | 優先工具 |
|------|----------|
| 找檔案 | `fd` |
| 搜尋文字 | `rg` |
| JSON 處理 | `jq` |
| YAML / XML 處理 | `yq` |
| Rust 測試 | `cargo test` |
| Node / UI 測試 | 依既有 package manager 執行 |

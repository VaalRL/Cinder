# 0075. 容器化中繼站自架（Dockerfile ＋ HTTP 健康端點）

- 狀態：已接受
- 日期：2026-07-10
- 相關文件：docs/adr/0005（自建 Worker relay）、0056/0059（DO SQLite／休眠）、
  docs/self-hosting-zeabur.md、docs/self-hosting-raspberry-pi.md、relay/Dockerfile、
  relay/src/node-relay.ts

## 背景與問題

`node-relay`（ADR-0056 的 `RelayCore` + Node/`node:sqlite` 外殼）已可在任何 Node 22+
機器長駐。但社群要在 **PaaS（Zeabur/Railway/Fly 等）** 一鍵部署，缺兩塊：

1. **無容器化配方**：monorepo + pnpm workspace + esbuild bundle + `node:sqlite` 的組合，
   對外部部署者門檻高。
2. **PaaS 健康檢查失敗**：`node-relay` 原為純 WebSocket 伺服器，對一般 HTTP `GET /`
   不回應——PaaS 的 HTTP 健康檢查會超時、把服務誤判為離線。

## 考量的選項

- 選項 A：只留樹莓派/家用自架（cloudflared/Caddy 手動弄 TLS）——PaaS 使用者無現成路。
- 選項 B：**附 Dockerfile ＋ node-relay 加 HTTP 健康端點**（採用）——見決策。
- 選項 C：為 PaaS 另寫一套伺服器——違反 Fix First／單一 `RelayCore` 原則，否決。

## 決策

1. **node-relay 掛 HTTP 伺服器**：以 `node:http` 建伺服器，一般請求回 `200 "Cinder relay"`
   （比照 Cloudflare `worker.ts`），WebSocket 升級交給 `ws`（`new WebSocketServer({ server })`）。
   健康檢查與 WS 互不干擾；PORT 讀平台注入的 `process.env.PORT`、綁 `0.0.0.0`。
2. **附 `relay/Dockerfile`**（多階段）：builder 以 pnpm 裝 workspace、esbuild 打成單檔
   ESM bundle（含 `@cinder/core`，僅 `ws` 外部）；runtime 精簡映像只帶 bundle。
   - **ESM 執行前提**：runtime 目錄需帶 `"type":"module"` 的 `package.json`
     （`relay/docker-runtime.package.json`），否則 Node 依 `.js` 當 CommonJS → bundle 的
     `import`/`import.meta` 開機即 `SyntaxError`。此檔同時**鎖定 `ws` 版本**（可重現建置）。
   - `node:22` 的 `node:sqlite` 以 `--experimental-sqlite` 啟用。
3. **持久化**：離線留言 SQLite 檔預設 `DB_PATH=/data/cinder-relay.db`，PaaS 掛 volume 於
   `/data` 即跨重啟存活；未掛則存容器內（7 天 TTL，重啟遺失未取件留言，可接受）。
4. TLS/`wss://` 由 PaaS 邊界終結，容器只跑 `ws://:PORT`——不在容器內處理憑證。

## 理由

- 全程重用同一套 `RelayCore`（Fix First）；HTTP 端點是小幅、對所有容器/PaaS 皆受益的
  健康檢查修正。零伺服器狀態與只轉發密文的隱私鐵則不變（自架反而路徑不經第三方雲）。

## 後果

- 正面：社群可在 PaaS 一鍵自架、自動 `wss://`、免開埠/憑證；補齊 ADR-0069 的第二座
  錨點來源（不同平台/網域）。
- 負面／已知殘餘風險：node-relay 現多監聽 HTTP（極輕量）；Dockerfile 綁 `node:22` 與
  `--experimental-sqlite`（換基底映像須同步調整）；PaaS 休眠策略可能影響離線留言即時性
  （文件已提醒保持常駐）。
- 後續行動 / 待辦：OPERATOR-TODO 可將「立第二座錨點」指向 Zeabur 自架；文件見
  `docs/self-hosting-zeabur.md`。

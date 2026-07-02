# 0031. 動態貼圖：宣告式 SVG 動畫（CSS keyframes）

- 狀態：已接受
- 日期：2026-07-02
- 相關文件：docs/adr/0021（貼圖）、apps/desktop/src/stickers.ts、apps/desktop/src/ui/ConversationWindow.tsx

## 背景與問題

貼圖 v1（ADR-0021）為靜態原創 SVG，經 `svgToDataUri` 以 `<img src>` 渲染。
要加入「動態貼圖」，需在**不擴大攻擊面、不新增重量級依賴、不改協定**下實作，並維持商標安全（原創資產）。

關鍵技術限制：貼圖以 `<img src=dataURI>` 呈現。`<img>` 參照的 SVG 中，
**宣告式動畫（CSS `@keyframes` / SMIL）會播放，但內嵌 JavaScript 被停用**。

## 考量的選項

- **A：宣告式動畫 SVG**（CSS keyframes 或 SMIL，內嵌於 SVG）。沿用現有 `<img>` 管線與 data URI，標記格式 `nb-sticker:v1:<pack>/<id>` 不變。
- **B：APNG / 動態 WebP（raster）**。`<img>` 可播，但需資產管線（Vite `?url`）、bundle 變大、素材製作成本高。
- **C：Lottie / JS 驅動**。需 `lottie-web` 執行期，改渲染路徑、新外部依賴、攻擊面擴大。

## 決策

採 **A：宣告式動畫 SVG，動畫以 CSS `@keyframes` 內嵌於 SVG `<style>`**。

- 沿用既有 `svgToDataUri` + `<img>`：**渲染路徑、資料模型、協定標記完全不變**；動畫「自帶」於 SVG 內容中。
- 動畫用 CSS keyframes（`transform-box: fill-box`）而非 SMIL，因為可再以
  `@media (prefers-reduced-motion: reduce)` 停用動畫，尊重無障礙偏好。
- 新增原創動態包 `motion`；因 SVG 為文字、gzip 後極小，仍以 data URI 內嵌，**毋須引入 raster 資產管線**。

明確拒絕 B（資產管線與 bundle 成本）與 C（JS runtime／依賴／攻擊面）。

## 理由

- A 的增量近乎零：不動渲染、不動 `AppStorage`、不動 Nostr 事件契約；動畫是資產本身的性質。
- CSS keyframes 可被 `prefers-reduced-motion` 關閉，比 SMIL 更符合無障礙。
- 維持「內建、受信任、原創」資產原則；`<img>` 停用 JS 亦自然阻擋 SVG 腳本注入風險。

## 後果

- 正面：動態貼圖零協定/依賴/攻擊面變化；舊客戶端不受影響（仍是同一 `pack/id` 標記，只是 SVG 會動）；尊重減少動態偏好。
- 負面 / 已知殘餘風險：僅支援宣告式（迴圈）動畫，無法做 JS 驅動的複雜互動；複雜逐格動畫若未來需要，再另立 ADR 評估 raster/Lottie。
- 後續行動：`motion` 包提供數款動態貼圖；測試驗證其為合法 SVG、含 `@keyframes` 與 `prefers-reduced-motion` 保護。

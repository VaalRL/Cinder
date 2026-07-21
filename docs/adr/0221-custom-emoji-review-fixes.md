# 0221. ADR-0220 自訂 emoji／貼圖庫 審查修正

- 狀態：已接受（已實作）
- 日期：2026-07-21
- 相關文件：ADR-0220（統一自訂資產）、ADR-0112/0054（靜態加密）、ADR-0032（自製貼圖）

## 背景與問題

ADR-0220 落地後做對抗式程式碼審查（正確性/並發 ＋ 安全/加密 兩位獨立審查者）。XSS/RCE 主防線穩固（對端 SVG 皆 `validateStickerSvg` 後以 `<img src=data:image/svg+xml>` 渲染＝secure static mode），但發現若干**資料遺失／隱私／DoS**問題需修：

- **C1 遷移 ↔ 自動收藏競態**：首次掛載時兩 effect 同批執行，自動收藏用 `let cur = library`（陳舊閉包），會蓋掉剛遷移的舊庫。
- **C2 多對話窗 lost-update**：`open.map` 同時掛載多個 `ConversationWindow`，各持一份 `library` state、盲目全量寫回共享儲存 → 互相覆蓋。
- **H1 遷移後舊明文殘留**：遷移複製舊全域明文庫進加密儲存後**未刪除**來源 `nb.stickers.custom`（明文 localStorage），抵銷加密目標。
- **H2 內容雜湊碰撞覆蓋自訂短碼**：`acquireAssets` 遇同 `contentHash` 以對端版本取代本地，覆蓋掉使用者自選的 shortcode。
- **H3 行內 emoji 渲染數無上限**：可見文字重複 `:x:` 無界，展開路徑渲染上萬個大 data-URI `<img>` → 客戶端 DoS。
- **M1** LRU 只保護「最愛」，自建但未加最愛者會被別人來圖擠掉。
- **M2** 短碼大小寫不一致（prompt 允許大寫、`findByShortcode` 精確比對）。
- **L1** `parseAssetManifest` 收端未擋總位元組（只擋筆數＋每筆）。
- **L2** `renderRichText` 只用本則清單、未回退本機庫，與註解不符。
- **L3** 送出端未擋清單筆數上限（只擋位元組）。
- **L4** `validateStickerSvg` 拒收清單有縫（CSS `@import`、`/` 分隔事件處理器）——目前因 `<img>` 渲染而惰性，屬縱深防禦缺口。

## 決策

1. **C1/C2 同根因＝「對共享儲存做陳舊 read-modify-write」→ 一律讀最新再寫**：所有庫變更（自動收藏、收藏、刪除、匯入、批次匯入）改以 `loadLib()`（讀當前儲存）為基底，而非 React `library` state；寫入後仍 `setLibrary` 更新本窗顯示。單執行緒下「讀-改-寫」即原子，跨窗/跨 effect 不再互相覆蓋。（顯示層跨窗延遲屬可接受，非資料問題。）
2. **H1 遷移後刪除舊明文**：`as.save(old)` 成功後 `clearLegacyLibrary()` 刪 `nb.stickers.custom`，且遷移旗標改在**成功之後**才設。**取捨（多身分）**：舊全域庫（ADR-0220 前本就全域共用）會歸給「升級後第一個開對話的身分」並刪除明文；其餘身分起始為空。優先隱私紅線（不留明文）勝過多身分遷移完整性；多身分＋既有自製貼圖屬罕見組合。
3. **H2 碰撞保留本地短碼**：`acquireAssets` 遇同 id 且本地已自訂 shortcode 時，保留本地版本（不被對端 label/shortcode 覆蓋）。
4. **H3 每則行內 emoji 渲染上限** `INLINE_EMOJI_MAX=50`：`resolveInlineEmoji` 達上限後其餘 `:shortcode:` 留為字面文字；展開路徑同套（與字元截斷解耦）。
5. **M1 保護自建**：`CustomAsset` 加 `mine?: boolean`；`addSticker`/`setShortcode` 標記自建；LRU `protect` 納入 `mine`。
6. **M2 短碼正規化小寫**：`addSticker`/`setShortcode` 建立時 `toLowerCase`；`findByShortcode` 查詢亦小寫（一致）。
7. **L1 收端總位元組上限**：`parseAssetManifest` 累計位元組超 `ASSET_MANIFEST_MAX_BYTES` 即停，與送出端一致。
8. **L3 送出端筆數上限**：`attachManifest` 清單筆數超 `ASSET_MANIFEST_MAX_COUNT` 亦拒送並提示（同位元組處理）。
9. **L4 收緊 `validateStickerSvg`**：攔 `@import`、事件處理器改容忍 `/` 分隔符。
10. **L2 對齊註解**：`custom-assets.ts` 標頭改述「本則清單 → 字面」；本機庫**刻意不**用於渲染他人訊息（避免以本地同名 shortcode 渲染出與寄件者不同的圖）。

## 後果

- **正面**：消除兩條資料遺失路徑（遷移競態、跨窗覆蓋）；補上加密隱私紅線（刪明文）；擋住對端可觸發的渲染 DoS；短碼行為一致；縱深防禦更嚴。
- **負面／殘餘**：多身分裝置的既有全域庫只歸第一個身分（見決策 2 取捨）；跨窗顯示可能短暫不同步（下次開窗/重繪即一致，非資料問題）；`setShortcode` 仍為 API、尚未接 UI（保留供日後「改短碼」）。
- **測試**：新增/更新 core（acquireAssets 保留本地/mine、resolveInlineEmoji 上限、parseAssetManifest 位元組、validateStickerSvg 收緊）、sticker-library（小寫/mine/clearLegacy）、ConversationWindow（讀最新再寫、遷移刪明文、渲染上限）測試。

# 0084. 程式碼識別字命名——行動端 i18n 前綴一致化，其餘刻意保留

- 狀態：已接受
- 日期：2026-07-12
- 相關文件：ADR-0082（使用者可見名稱詞彙表）；`packages/i18n/src/messages.ts`、`apps/mobile/src/*`

## 背景與問題

ADR-0082 統一了**使用者可見名稱**，但明確把**程式碼識別字**列為待辦（選項 B）。盤點出的識別字「不一致」有：

1. 行動端 i18n 鍵前綴 `msignin_`（全小寫）與桌面 `signIn_`（camelCase）大小寫風格不一致。
2. core `runPairingSource`/`runPairingTarget` vs engine `runPairSource`/`runPairTarget`（-ing 差異）。
3. `snapshot`（4 處：CloudSnapshot／StorageSnapshot／group-snapshot／ConnSnapshot）與 UI 已改稱「雲端備份」。
4. `cloudSync`／`CloudSyncMode` 識別字 vs UI「雲端備份」。
5. relay 換座動詞 `switch`／`migrate`／`change`／`drain`／`retire`。
6. `rescue`／`restore`／`import` 詞面。

## 決策

**只一致化「純風格、零風險」的識別字；其餘經評估為語意正確或改名有實質風險者，刻意保留並在此記錄理由。**

### 已改

- **行動端 i18n 鍵前綴**：`msignin_*` → `mobileSignIn_*`、`mpair_*` → `mobilePair_*`（與桌面 `signIn_` 同為 camelCase、並以 `mobile` 明確命名空間）。純內部鍵，改動由 TypeScript `MessageKey` 聯集型別於 typecheck 全程把關。

### 刻意保留（附理由）

- **`runPairingSource`（core）vs `runPairSource`（engine）**：兩者在**不同層**——core 是配對協定原語、engine 是會期編排包裝；名稱差異正好標示層次，強行對齊反而抹除語意。
- **`snapshot`**：是「可尋址快照事件」的**技術正確術語**，且含 `SNAPSHOT_KIND` 等接近協定的常數；四種 snapshot（雲端／配對全量／群組／relay 休眠）各有其領域，非同物異名。UI 稱「雲端備份」屬**呈現層**用語，與內部術語分離是刻意設計（如同 buffer/draft）。
- **`cloudSync`／`CloudSyncMode`**：`cloudSync` 是**持久化於 Profile 的欄位**，改名等於要做 localStorage 資料遷移——風險與收益不成比例。
- **relay `switch`／`migrate`／`change`／`drain`／`retire`**：分別對應 session 內遞補（T1）／durable 搬遷（T2/T3）／手動換座（H2）／舊站排水（H3）／退役撤離——**是不同機制**，不是同一件事的多名。
- **`rescue`／`restore`／`import`**：分別對應忘記密碼救援／雲端還原／貼上匯入——**不同流程**，保留區別。

## 理由

- 只改真正 cosmetic 且零風險者，最大化「一致性收益 ÷ 變更風險」。
- 其餘「不一致」實為**層次／領域／機制的語意區別**，或改名需**資料遷移**；強行統一會降低清晰度或引入風險。UI 名稱（ADR-0082）與內部識別字分離本就是可接受且常見的設計。

## 後果

- 正面：行動端 i18n 鍵前綴與桌面一致；其餘保留決策有明文依據，未來不再反覆糾結。
- 負面 / 已知殘餘：UI「雲端備份」與識別字 `cloudSync`/`snapshot` 詞面仍不同——已知且接受（呈現層 vs 內部術語）。
- 後續：若日後真要單一化 `cloudSync`/`snapshot`，須連同持久化資料遷移一併規劃，另立 ADR。

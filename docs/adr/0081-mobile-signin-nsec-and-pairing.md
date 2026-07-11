# 0081. 行動端登入：nsec 匯入（A）＋配對匯入（B），同帳號跨裝置

- 狀態：已接受
- 日期：2026-07-12
- 相關文件：ADR-0063（行動端骨架）、ADR-0072（D4a 桌面配對克隆）、ADR-0015（身分備份 nsec）、ADR-0080（跨前端主題 token）；`packages/core/keys.ts`、`packages/core/pairing.ts`、`packages/engine/backend/pairing-session.ts`

## 背景與問題

使用者已在桌面登入（身分＝本機生成的 Nostr secp256k1 私鑰）。行動端骨架（ADR-0063）此前**只有聯絡人清單、沒有登入**，無法在手機以「同一個帳號」進入——而「同帳號」在本專案的定義就是「同一把私鑰同時在兩台裝置」。

需要一條在此環境（react-native-web、無原生工具鏈、無真機/真 relay）就能開發＋測試，且未來上原生可直接沿用的行動端登入路徑。

## 考量的選項

- **選項 A：nsec 匯入。** 使用者在桌面「設定 → 身分備份」複製 `nsec`，於手機貼上、本機解碼還原同帳號。最直接、可完全離線、在此環境可完整驗證。
- **選項 B：配對匯入。** 沿用桌面 D4a 配對克隆（ADR-0072）：舊機顯示配對碼、新機貼上、比對 SAS 短碼，收到全量捆包後由 `snapshot.identity.nsec` 得到同帳號（並帶聯絡人/群組/訊息）。體驗最好但傳輸需 WebRTC＋relay 會合。
- **只做 A**：略。
- **重寫行動端自有金鑰/登入協定**：違反 SSOT，捨棄。

## 決策

**A、B 都做，登入邏輯純函式化並最大化重用 core/engine；配對「傳輸層」以注入延後到原生。**

1. **`apps/mobile/src/auth.ts`（純邏輯、無 UI/DOM）：**
   - `identityFromNsec(nsec, name)`：`@cinder/core` `nsecDecode`→`getPublicKey`→`npubEncode`，回 `MobileIdentity{ sk, pubkey, npub, nsec, name }`；名稱空白或 nsec 非法回 i18n 錯誤鍵。
   - `npubFromNsec(nsec)`：畫面即時預覽導出的 npub。
   - `identityFromPairBundle(bundle, overrideName?)`：自 `@cinder/engine` `PairBundle` 的 `snapshot.identity.nsec` 萃取同帳號。
   - `previewPairing(code)`：`@cinder/core` `parsePairing` 驗證配對碼並取會合中繼站主機名。
2. **兩個 RN 畫面**（`NsecSignInScreen`、`PairImportScreen`）：吃 `@cinder/theme`（ADR-0080）與 `@cinder/i18n`；私鑰輸入 `secureTextEntry` 遮罩＋npub 預覽；配對畫面顯示 SAS 供人工比對。
3. **配對傳輸注入**：畫面的 `onPair(code, onSas)` 由呼叫端注入——產線＝engine `runPairTarget`＋`webRtcPairTransport`（WebRTC＋拋棄式 relay 會合）；此環境／測試注入記憶體傳輸即可跑完整驅動。
4. **測試**：`auth.ts` 純函式詳測；並以**真實配對協定**（`runPairSource`/`runPairTarget`＋記憶體傳輸＋`MemoryStorage` 存真 nsec）產出捆包餵給 `identityFromPairBundle`，證明萃取吃得下引擎實際輸出（抓形狀漂移）。

## 理由

- **重用而非重寫**：金鑰、配對協定、捆包格式全用既有 core/engine，行動端只加薄薄的登入 UI 與萃取層。
- **同帳號語意正確**：A/B 兩路最終都落到「同一把 `sk`」，與桌面帳號模型一致。
- **此環境可驗**：A 完整可驗；B 的畫面驅動流程以記憶體傳輸驗證，只有真 WebRTC/relay 留待原生。
- **隱私**：私鑰只在本機解碼、絕不外流（延續 ADR-0015）；配對載荷短時效、SAS 綁定連線（ADR-0072）。

## 後果

- 正面：手機可用 nsec 或配對，以桌面同帳號登入；登入邏輯有測試、上原生可直接接。
- 負面 / 已知殘餘風險：
  - 配對的**真實傳輸（WebRTC＋relay 會合）需原生/EAS**，此環境無法端到端實測（ADR-0063 限制）。
  - 尚無「登入後」的行動端 app 殼（導覽、把 `MobileIdentity` 存進 RN 安全儲存並啟動引擎）——屬 D1 後續與 D2（Keystore/Secure Enclave）。
  - nsec 貼上目前明碼存在 React state（記憶體）；原生落地需存 OS 金鑰庫（D2）。
- 後續行動：行動端 app 殼＋導覽（A/B/聯絡人）、RN 安全儲存、把 `onPair` 接上 `webRtcPairTransport`（原生）、登入後啟動 `RelayChatBackend`。

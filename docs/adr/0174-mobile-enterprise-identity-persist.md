# 0174. 行動端配對企業身分跨重啟持久——記住＋登錄帶 org

- 狀態：已接受（已實作）
- 日期：2026-07-17
- 相關文件：ADR-0172（企業身分經配對搬家帶到行動端）、0173（行動端企業身分後端接線）、
  0138（多身分登錄）、0117（記住我／本地密碼）、0118/0125（配對搬家）、0112（絕不明文存 nsec）

## 背景與問題

ADR-0173 讓配對搬來的企業成員身分在**當次 session** 以企業身分運作，但明載殘留：行動端配對進來的
身分是**暫時 session**——不寫 profiles 登錄、`signInWith` 把 store 的 nsec 抹掉（ADR-0112 紅線），
重啟即開不了那份（加密的）儲存，企業接線隨之消失，需重新配對。

要「跨重啟持久」，必須讓配對身分**被記住**（Argon2id 密碼包裹 nsec 落地＋寫入登錄），且把
**企業身分精華**一起持久化，下次解鎖即以企業身分啟動。

## 決策

### 1. 配對匯入可「記住此裝置」（`PairImportScreen` 加密碼欄）

沿用 ADR-0117 的「記住我」：配對畫面新增本地密碼欄（`remember_*` 既有 i18n）。**留空＝暫時
session**（沿用舊行為，重啟需重配對）；**設密碼＝記住**。`onImport(bundle, identity, password?)`。

### 2. `rememberInProfile` 把 org 寫進登錄 Profile

新增 `org?: PairBundleOrg` 參數；登錄 `Profile` 依此填 `enterprise/orgOwner/adminPubkey/
orgJoinToken/orgEscrow`（`Profile` 型別本就有這些欄，桌面同款）。`importFromOldDevice` 有密碼時
以 `bundle.org` 呼叫（remember 用真 nsec，須在 `signInWith` 抹掉 store nsec **之前**——remembered
blob 與 store 是分開兩份）。

### 3. 建後端時 org 取「捆包或登錄」（`signInWith`）

`signInWith` 的企業精華改為 `bundle?.org ?? profileOrg(登錄中該身分的 Profile)`：
- **配對當下**：用捆包 org（0173 當次即企業運作）。
- **重啟解鎖**：無捆包 → 從**已記住的登錄 Profile** 抽回 org（新增純函式 `profileOrg`）＝持久。

據此 `createBackend({ org })`（訂閱公司名冊，0173）＋`setSelfEnterprise`（頭銜編輯器設閘）。
`profileOrg` 為純函式，覆蓋 unlock／switch／pair 三條 sign-in 路徑（皆讀當前登錄，無 setState 時序坑）。

## 後果

- 正面：配對企業身分「設密碼記住」後，**重啟解鎖即自動以企業身分啟動**（連公司座、採用名冊、
  同事/頭銜/allowlist/政策、頭銜編輯器設閘）——企業身分在行動端的完整鏈路（桌面建立→配對帶來
  →後端運作→跨重啟持久）到此打通。附帶：一般配對身分也終於能「記住」而不必每次重配對。
- 已知限制／取捨：
  - 仍是**唯讀**（ADR-0173）：不從行動端入職/託管/發邀請/管理名冊。
  - org 精華存在**登錄 Profile**（`nb.profiles`，非機密——`adminPubkey` 本就是公開值、
    `orgJoinToken` 是使用者自己持有的 capability）；nsec 仍只以 Argon2id 密碼包裹（ADR-0112 不變）。
  - 留空密碼＝暫時 session（刻意保留：不強迫在新裝置落地私鑰）。
- 測試：`identities.test` 補 `profileOrg` 抽取（純函式）＋`rememberInProfile` 帶/不帶 org；行動端
  169 測試綠燈、typecheck 通過。

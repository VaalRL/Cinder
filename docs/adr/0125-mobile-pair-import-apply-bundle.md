# 0125. 行動端配對搬家要**套用捆包**，不是只還原身分

- 狀態：已接受（已實作）
- 日期：2026-07-15
- 相關文件：**ADR-0118（配對捆包身分＋行動端送出端）**、0072（配對克隆 D4a）、
  0112（web/mobile：nsec 不得明文落盤）、0122（身分不得被靜默替換）、0071（雲端快照）、0119（健檢：本問題於該次發現）

## 背景與問題

ADR-0118 補上了行動端配對搬家的**送出端**，也修好了「捆包沒有身分」的 bug。但**匯入端從沒真的
套用捆包**：

```ts
// PairImportScreen.tsx（修正前）
.then((bundle) => {
  const r = identityFromPairBundle(bundle);
  if (!r.ok) { setError(r.error); return; }
  onSignIn(r.identity);   // ← 只萃取身分，bundle 的其餘部分**直接丟掉**
})
```

`identityFromPairBundle` 只從捆包裡挖出 nsec＋名字，然後 `onSignIn` 拿它建一個**全新的空儲存**。
**聯絡人、訊息、群組、封鎖清單——全部沒搬過去。**

失敗模式跟 ADR-0118 修的那個一樣惡劣：使用者比對完 SAS、看到「配對成功」，**以為整支手機的
對話都搬過來了**，結果打開只有一個沒有任何聯絡人的空帳號。而桌面（ADR-0118 的鏡像）早就
`applyPairBundle` 了——這是行動端漏接的一半。

## 決策

### 1. 匯入端交出**整個捆包**，由 App 套用（鏡像桌面）

`PairImportScreen` 的回呼從 `onSignIn(identity)` 改為 `onImport(bundle, identity)`：畫面仍負責
驗證（`identityFromPairBundle` 失敗就顯示「缺少身分」），但驗證通過後把**整個捆包**交出去。

`MobileApp` 走 `applyPairBundle(store, bundle)`——與桌面同一個引擎函式，不另造。

### 2. 🔴 套用**必須在建後端之前**，讓 `start()` 回放

`RelayChatBackend.start()` 會回放 store 裡的聯絡人與 1:1 歷史（`for (const c of contacts) onHistory(...)`）。
所以只要在**建後端之前**把捆包灌進 store，UI 就會自動收到全部聯絡人與訊息——不需要任何額外的
「搬完後刷新」邏輯。因此套用點放在 `signInWith(identity, bundle?)` 裡、建 `store` 之後、
建 `backend` 之前。

### 3. 🔴 nsec 抹掉，絕不明文落盤

`applyPairBundle` 會 `saveIdentity(snapshot.identity)`——那**含真實 nsec**。行動端與桌面瀏覽器
一樣**沒有 OS 金鑰庫**，而「用資料 DEK 加密 nsec」是循環的（DEK 由 nsec 導出＝加密它沒有意義）。
所以套用後立刻覆寫：

```ts
applyPairBundle(store, bundle);
store.saveIdentity({ nsec: "", name: identity.name });   // 只留名字，nsec 不落盤（ADR-0112）
```

store 本身以 nsec 導出的 DEK 加密（ADR-0112），nsec 只活在記憶體。**這與桌面瀏覽器
`importFromOldDevice` 是同一招**——不發明新機制。

### 4. 接續舊機的備份習慣

捆包帶 `cloudSync`（ADR-0071）。新機採用它——換手機不該把「我原本有開雲端備份」這件事忘掉。

### 5. 順帶：行動端補上 ADR-0122 的身分守衛

`createRelayChat` 現在傳 `expectPubkey: identity.pubkey`。行動端一直沒有這道守衛——
毀損的捆包或錯誤的 nsec 會讓引擎默默用另一把金鑰建身分（ADR-0122 講的那個失敗模式）。
`nsecOverride` 恆存在，所以這只是把「解出來的 pubkey 與期待不符」變成明確錯誤。

## 理由

- 這是 ADR-0118 漏掉的一半：那份 ADR 把重心放在「送出端要有身分」，結果**匯入端連身分以外的
  東西都沒套用**。桌面對、行動端錯——同一條路徑兩個平台不一致，正是最容易漏的地方。
- 而測試**不測 UI 測資料流**（`signInWith` 在元件裡、SSR 跑不到）：源機建捆包 → 過線 →
  新機加密 store 套用 → 抹 nsec → 全新 backend 回放。這與 ADR-0122 的測法一脈相承。

## 後果

- 正面：
  - 行動端換手機真的把**聯絡人＋訊息＋群組**搬過去了（原本只搬空身分）。
  - 與桌面 `importFromOldDevice` 同一套（`applyPairBundle` ＋ 抹 nsec ＋ 加密 store），零特例。
  - 行動端補上 ADR-0122 的 `expectPubkey` 守衛。
  - 測試 1008 → **1011**（engine +3：換手機後聯絡人/訊息在、群組也搬了、**nsec 絕不落盤**；
    以真的加密 store ＋ 真的 backend 回放，不是渲染畫面）。

- 已知限制：
  - **只搬熱區**（ADR-0111：封存不進 `StorageSnapshot`——幾百 MB 塞不進 P2P 信封）。與桌面相同。
  - 已讀水位隨快照搬移（`readAt` 在 snapshot 內）；但雲端快照那條路不含它（ADR-0108 劃線），
    兩條路的行為差異沿用既有設計。

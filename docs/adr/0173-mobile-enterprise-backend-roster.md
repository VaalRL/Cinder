# 0173. 行動端企業身分後端接線——唯讀採用公司名冊

- 狀態：已接受（已實作）
- 日期：2026-07-17
- 相關文件：ADR-0172（企業身分經配對搬家帶到行動端）、0047（組織名冊）、0048（企業政策）、
  0100（行動端後端接線）、0155/0156（企業主/入職）

## 背景與問題

ADR-0172 把企業身分精華（`org`）經配對搬家帶到行動端，並據以設閘頭銜編輯器，但明載殘留：
「`adminPubkey` 已到行動端，但**後端尚未據以連公司座/抓名冊**」。本 ADR 補上這一步——讓
配對搬來的企業成員身分，其行動端後端**真的以企業身分運作**（採用公司名冊）。

## 決策

### 1. 把 org 精華透傳給後端建構

`MobileBackendOptions` 新增 `org?: PairBundleOrg`；`createRelayChat` 鏡像桌面 `buildBackend`：
- `org.adminPubkey` → `orgAdminPubkey`：後端訂閱管理者名冊並採用（`adoptRoster`）＝**同事自動
  進通訊錄、allowlist 生效、企業政策（`onPolicy`）、組織資訊（`onOrgInfo`）**。
- `org.orgOwner` → `orgOwner`。

`signInWith` 把 `bundle.org` 帶入 `createBackend`。

### 2. 唯讀採用（本批的明確邊界）

**只帶 `adminPubkey`／`orgOwner`，不帶 `orgJoinToken`／`orgEscrow`**——即不從行動端重觸發
入職請求與金鑰託管**寫入**流程（成員已在桌面入職、名冊已收錄，行動端**讀**名冊即可）。這
避免行動端重送 nsec 託管等副作用，把本批鎖在安全的「唯讀採用」。

### 3. `onOrgInfo` 確認企業身分（更穩健的設閘）

行動端接 `onOrgInfo` → `setSelfEnterprise(true)`：以**實際名冊採用**確認會員身分，比只信捆包
旗標更穩健（ADR-0172 的頭銜編輯器設閘因此有雙重來源：捆包 org ＋ live 名冊）。同事清單與
allowlist 由引擎既有的 `onContacts`（已接）自動帶入，不需新 UI。

## 後果

- 正面：配對搬來的企業成員，其行動端會**自動出現同事**（含頭銜 chip）、套用公司 allowlist
  與政策、確認企業身分——行動端首次以企業身分實際運作。零協定/中繼變更（沿用既有名冊機制）。
- 已知限制／取捨：
  - **仍是 session 範圍**：行動端配對進來的身分不寫 profiles 登錄（既有限制），故 org 接線於
    重啟後需重新配對才恢復。**durable 化**（把配對身分連同 org 精華記住進登錄、下次解鎖即以
    企業身分啟動）是**下一批**。
  - **唯讀**：不支援從行動端入職/託管/發邀請/管理名冊（企業主管理仍在桌面）。
  - 名冊採用/allowlist 的實際行為由 engine `relay-backend.test.ts` 把關；行動端層以建構 smoke
    測試＋typecheck 確保 org 透傳無誤（`createBackend` 內用 `webSocketConnector`，不便在此注入
    假連線觀察訂閱）。
- 測試：`backend.test.ts` 補「帶 org 建構不炸／示範模式忽略 org」；行動端 166 測試綠燈、typecheck 通過。

---
allowed-tools: Read, Grep, Glob, Bash, Agent
argument-hint: [feature-name] | --audit [existing-feature-path] | --design [new-feature-name]
description: 功能涵蓋範圍檢查 — 設計新功能或審核既有功能的完整性
---

# 功能涵蓋範圍檢查（Feature Coverage Check）

針對功能「**$ARGUMENTS**」進行完整性分析。

本 Skill 基於 CRM 模組（5 batch、16 個維度、40+ 檔案）的實作經驗，提供一套標準化的功能涵蓋範圍檢查清單。

---

## 模式判斷

根據 `$ARGUMENTS` 判斷執行模式：

- **`--audit [path]`** → 審核模式：掃描既有功能，產出缺失報告
- **`--design [name]`** → 設計模式：為新功能產出完整涵蓋範圍建議
- **無旗標** → 自動判斷：先搜尋是否已有相關檔案，有則進入審核模式，否則設計模式

---

## 階段 1：情境收集

### 1.1 判斷功能範圍

1. 搜尋以下位置確認功能是否已存在：
   - `src/app/admin/[feature]/` — Admin 路由
   - `src/app/ops/[feature]/` — Ops 路由
   - `src/components/admin/[feature]/` — Admin 元件
   - `src/components/ops/[feature]/` — Ops 元件
   - `src/types/[feature].ts` — 型別定義
   - `src/lib/constants/[feature].ts` — 常數
   - `supabase/migrations/*[feature]*.sql` — 資料庫

2. 搜尋 Sidebar 確認是否有導航入口：
   - `src/components/admin/AdminSidebar.tsx`
   - `src/components/ops/OpsSidebar.tsx`

3. 搜尋 Feature Code 確認是否有訂閱分級：
   - `src/types/subscription.ts` 中的 `FEATURE_CODES`

### 1.2 理解本專案架構分層

本專案為 **多租戶 SaaS**，有兩個獨立後台：

| 後台 | 路徑 | 使用者 | 資料範圍 |
|------|------|--------|----------|
| **Admin** | `/admin/*` | 組織管理員 | 單一組織 |
| **Ops** | `/ops/*` | 平台營運者 | 跨組織彙總 |

每個功能可能需要在兩個後台都有對應頁面，但角度不同：
- **Admin** = CRUD 操作、日常管理
- **Ops** = 跨組織統計、監控、趨勢分析

---

## 階段 2：16 維度涵蓋範圍檢查

針對每個維度，檢查是否存在對應實作。用 ✅ / ⚠️ / ❌ 標記狀態。

### 🗄️ 第 1 層：資料基礎

| # | 維度 | 檢查項目 | 說明 |
|---|------|----------|------|
| 1 | **資料庫 Schema** | `supabase/migrations/*[feature]*.sql` | 表結構、RLS、索引、觸發器 |
| 2 | **TypeScript 型別** | `src/types/[feature].ts` | Entity、Payload、Enum 介面 |
| 3 | **常數與設定** | `src/lib/constants/[feature].ts` | Labels、Colors、Stages、Config Maps |

**檢查重點：**
- [ ] 是否有 RLS policies 且遵循 `is_org_member_of()` + `is_super_admin()` 模式？
- [ ] Entity 型別是否包含 optional joined data（如 `lead?: { full_name }` ）？
- [ ] Payload 型別是否區分 Create / Update（必填欄位不同）？
- [ ] 常數是否提供 label + color 對照表供 UI 渲染？
- [ ] 是否有 helper 函數（如 `getStageLabel()`, `getStageColor()`）？

### 🔑 第 2 層：訂閱與授權

| # | 維度 | 檢查項目 | 說明 |
|---|------|----------|------|
| 4 | **Feature Codes** | `FEATURE_CODES` in `subscription.ts` | 訂閱方案分級 |
| 5 | **Feature 種子資料** | `supabase/migrations/*seed*feature*.sql` | DB features + plan_features 記錄 |
| 6 | **權限碼** | `authz-permission-catalog` 或 sidebar permissions | Admin AuthZ / Ops permission 碼 |

**檢查重點：**
- [ ] 是否有 Free / Pro / Ace 分級？哪些功能是 Core（免費）？
- [ ] `MIN_PLAN_FOR_FEATURE` 是否有對應映射？
- [ ] `UpgradePrompt.tsx` 的 `FEATURE_NAMES` + `FEATURE_UNLOCK_PLAN` 是否已更新？
- [ ] Ops sidebar 的 `permission` 欄位是否已設定？

### 🖥️ 第 3 層：Admin 後台（單組織操作）

| # | 維度 | 檢查項目 | 說明 |
|---|------|----------|------|
| 7 | **Server Actions** | `src/app/admin/[feature]/actions.ts` | CRUD + 摘要查詢 |
| 8 | **路由頁面** | `src/app/admin/[feature]/**` | Layout + 各子頁面 |
| 9 | **UI 元件** | `src/components/admin/[feature]/` | Modal、Card、Board、Form、List |
| 10 | **Sidebar 導航** | `AdminSidebar.tsx` 中的 section/items | 導航入口 + feature gate |

**檢查重點：**
- [ ] 是否有 `layout.tsx` 包裹 `FeatureGate` ？
- [ ] Server actions 是否使用 `requireActiveOrgId()` 做組織隔離？
- [ ] 是否有總覽頁（KPI 摘要卡片）？
- [ ] 是否有詳情頁（`[id]/page.tsx`）含活動時間軸？
- [ ] CRUD 操作是否自動記錄活動日誌？
- [ ] 進階頁面是否有 `UpgradePrompt` 引導升級？
- [ ] Sidebar 項目是否有 feature gate（`feature: FEATURE_CODES.XXX`）？
- [ ] 是否考慮舊路由的 backward compatibility redirect？

### 📊 第 4 層：Ops 後台（跨組織監控）

| # | 維度 | 檢查項目 | 說明 |
|---|------|----------|------|
| 11 | **Ops Server Actions** | `src/app/ops/[feature]/actions.ts` | 跨組織彙總查詢 |
| 12 | **Ops 頁面** | `src/app/ops/[feature]/**` | 統計、分佈、趨勢 |
| 13 | **Ops Sidebar** | `OpsSidebar.tsx` 中的 section/items | 導航入口 + permission |

**檢查重點：**
- [ ] Ops actions 是否使用 `createAdminClient()` 而非 org-scoped client？
- [ ] 是否有跨組織彙總統計頁？（如：各組織 KPI 對比表）
- [ ] 是否有分佈/趨勢分析頁？（如：管道階段分佈圖）
- [ ] Ops 側邊欄是否有對應的 CRM/Feature section？

### ⚙️ 第 5 層：自動化與背景作業

| # | 維度 | 檢查項目 | 說明 |
|---|------|----------|------|
| 14 | **Automation Handlers** | `src/lib/automations/[feature]*.ts` | 排程作業邏輯 |
| 15 | **Job Registry** | `src/lib/jobs/registry.ts` | 動態載入註冊 |
| 16 | **Automation Templates** | `supabase/migrations/*seed*automation*.sql` | 排程設定種子資料 |

**檢查重點：**
- [ ] 是否有定期清理/檢查作業？（如：停滯線索檢查、逾期跟進標記）
- [ ] 是否有提前提醒作業？（如：帶看前一天提醒）
- [ ] Job handlers 是否使用 dynamic import 做 tree-shaking？
- [ ] Automation templates 是否設定合理的 cron 排程？

### 🔄 第 6 層：共用與整合

| # | 維度 | 檢查項目 | 說明 |
|---|------|----------|------|
| — | **共用元件** | `src/components/shared/[feature]/` | 跨 Admin/Ops 共用的視覺化元件 |
| — | **既有模組整合** | 其他模組是否引用此功能 | 如：合約模組觸發 CRM 活動記錄 |

---

## 階段 3：產出報告

### 審核模式（--audit）

產出以下格式的報告：

```markdown
# 功能涵蓋範圍審核報告：[Feature Name]

## 總覽
- 涵蓋率：X/16 維度
- 狀態：🟢 完整 / 🟡 大致完整 / 🔴 有顯著缺失

## 逐維度檢查結果

| # | 維度 | 狀態 | 現有檔案 | 備註 |
|---|------|------|----------|------|
| 1 | 資料庫 Schema | ✅ | migration_file.sql | — |
| 2 | TypeScript 型別 | ✅ | types/xxx.ts | — |
| ... | ... | ... | ... | ... |
| 11 | Ops Server Actions | ❌ | — | 尚未建立跨組織查詢 |
| 12 | Ops 頁面 | ❌ | — | 可新增統計儀表板 |

## 建議補強項目（依優先順序）

1. **[高] Ops 跨組織統計頁** — 目前 Ops 後台無此功能的監控視角
   - 建議新增：`src/app/ops/[feature]/page.tsx`
   - 參考：`src/app/ops/crm/page.tsx` 的跨組織 KPI 彙總模式

2. **[中] 自動化排程** — 無背景作業處理過期/提醒
   - 建議新增：`src/lib/automations/[feature]-automations.ts`

3. **[低] 共用視覺化元件** — Admin/Ops 可共用圖表
   - 建議新增：`src/components/shared/[feature]/`
```

### 設計模式（--design）

產出以下格式的建議：

```markdown
# 功能設計涵蓋範圍建議：[Feature Name]

## 建議檔案清單

### 第 1 批：資料基礎
| 操作 | 檔案路徑 | 說明 |
|------|----------|------|
| 新增 | `supabase/migrations/YYYYMMDD_create_[feature]_tables.sql` | 主表 + RLS + 索引 |
| 新增 | `src/types/[feature].ts` | Entity + Payload + Enum 型別 |
| 新增 | `src/lib/constants/[feature].ts` | Labels + Colors + Helpers |
| 修改 | `src/types/subscription.ts` | 新增 Feature Codes |

### 第 2 批：Admin 後台
| 操作 | 檔案路徑 | 說明 |
|------|----------|------|
| 新增 | `src/app/admin/[feature]/layout.tsx` | FeatureGate 包裹 |
| 新增 | `src/app/admin/[feature]/actions.ts` | CRUD Server Actions |
| 新增 | `src/app/admin/[feature]/page.tsx` | 總覽頁（KPI 卡片） |
| 新增 | `src/app/admin/[feature]/[sub]/page.tsx` | 各子功能頁 |
| 新增 | `src/components/admin/[feature]/*.tsx` | UI 元件 |
| 修改 | `AdminSidebar.tsx` | 新增導航 section |

### 第 3 批：Ops 後台
| 操作 | 檔案路徑 | 說明 |
|------|----------|------|
| 新增 | `src/app/ops/[feature]/actions.ts` | 跨組織彙總 Actions |
| 新增 | `src/app/ops/[feature]/page.tsx` | 跨組織統計頁 |
| 修改 | `OpsSidebar.tsx` | 新增導航項目 |

### 第 4 批：自動化
| 操作 | 檔案路徑 | 說明 |
|------|----------|------|
| 新增 | `src/lib/automations/[feature]-automations.ts` | 排程作業 |
| 修改 | `src/lib/jobs/registry.ts` | 註冊 handlers |
| 新增 | `supabase/migrations/*seed*automation*.sql` | 排程設定 |

## 不一定需要的維度

根據功能性質，以下維度可能不需要：
- 若功能不分 Free/Pro → 不需 Feature Codes
- 若功能是唯讀報表 → 不需 Automation
- 若功能已有現成 DB 表 → 不需新 Migration
- 若功能僅限 Admin → 不需 Ops 頁面（但建議確認）
```

---

## 常見遺漏提醒

根據過去實作經驗，以下是最容易被遺忘的項目：

1. **Ops 後台對應版本** — Admin 功能做完後忘記在 Ops 加監控視角
2. **UpgradePrompt 映射** — 新增 Feature Code 後忘記更新 `FEATURE_NAMES`
3. **Sidebar feature gate** — 加了路由但忘記在 sidebar 設定 feature 過濾
4. **Automation templates 種子** — 寫了 handler 但忘記建 DB 記錄讓使用者能啟用
5. **舊路由 redirect** — 搬遷功能路徑後忘記對舊 URL 做重導向
6. **Activity logging** — CRUD 操作後忘記自動記錄活動日誌
7. **Ops permission 碼** — Ops sidebar 項目忘記設 permission 欄位
8. **共用元件提取** — Admin 和 Ops 重複實作相同的視覺化邏輯

---

## 參考範例：CRM 模組

CRM 模組是本專案最完整的功能涵蓋範例（5 batch、16 維度全覆蓋）：

```
資料基礎：  3 migrations + types/crm.ts + constants/crm.ts
訂閱授權：  6 feature codes (CRM ~ CRM_AI_SCORING)
Admin 後台：actions.ts (1900行) + 10 pages + 8 components + sidebar section
Ops 後台：  actions.ts + 3 pages + sidebar section
自動化：    2 automation files + 4 job registry entries + automation templates
共用元件：  4 shared visualization components
```

如需深入瞭解任一維度的實作細節，可直接閱讀對應檔案。

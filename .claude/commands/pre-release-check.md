# /pre-release-check - 軟體上架前完整檢查清單

根據專案類型執行上架前全面檢查，確保產品符合發布標準。

## 執行指令

```bash
# 基本使用
/pre-release-check                          # 自動偵測專案類型（包含 todo 檢查）

# 指定專案類型
/pre-release-check --type=obsidian          # Obsidian Plugin
/pre-release-check --type=android           # Android App
/pre-release-check --type=ios               # iOS App
/pre-release-check --type=web               # Web App
/pre-release-check --type=saas              # SaaS 平台
/pre-release-check --type=electron          # Electron App
/pre-release-check --type=cli               # CLI 工具

# 輸出與執行選項
/pre-release-check --output=json            # 輸出 JSON 格式報告
/pre-release-check --skip-tests             # 跳過測試執行
/pre-release-check --full                   # 完整檢查（含長時間測試）

# Todo 檢查選項
/pre-release-check --skip=todos             # 跳過 todo 檢查（不建議）
/pre-release-check --only=todos             # 僅檢查 todos
/pre-release-check --force                  # 強制通過（即使有未完成 todos）

# 組合使用
/pre-release-check --type=cli --output=json --skip-tests
```

---

## 執行流程

### 階段 0：前置檢查 - Todo 狀態驗證

**在執行任何其他檢查前，必須先檢查專案 todo 狀態：**

#### 檢查 todos.md 檔案
1. **定位 todos.md**
   - 在專案 root 尋找 `todos.md`
   - 若不存在，跳過此檢查並記錄警告

2. **分析 Active todos**
   - 統計未完成任務數量
   - 檢查是否有過期任務（Due date 已過）
   - 列出所有 Active 任務供審查

3. **評估發布就緒度**
   - ✅ **可發布**：無 Active todos 或僅有非阻塞性任務
   - ⚠️ **警告**：有 1-5 個 Active todos（需使用者確認是否繼續）
   - ❌ **阻塞**：超過 5 個 Active todos 或有標記為 "blocker" 的任務

#### 檢查 Claude TodoWrite 狀態
1. **讀取當前 session 的 todo list**
   - 若有使用 TodoWrite 工具追蹤開發任務
   - 檢查是否有 pending 或 in_progress 狀態的任務

2. **警告條件**
   - 若有未完成的 todo items，提示使用者是否要：
     - 先完成這些任務再發布
     - 將這些任務記錄到 todos.md（持久化）
     - 忽略並繼續檢查（需明確確認）

#### 輸出範例
```markdown
## 🚦 Todo 狀態檢查

### todos.md 狀態
- Total Active: 3
- Past Due: 1
- Blockers: 0

#### Active Tasks:
1. [ ] Fix memory leak in data sync | Due: 12/03/2025 ❌ OVERDUE
2. [ ] Update API documentation
3. [ ] Add error handling to webhook handler

⚠️ **警告**：發現 1 個過期任務和 2 個未完成任務。建議處理後再發布。

### TodoWrite 狀態
- Current session todos: 2 pending
  1. [pending] Run final integration tests
  2. [pending] Update version numbers

⚠️ **建議**：完成或歸檔這些任務後再進行發布檢查。
```

**使用者確認機制**：
- 若發現阻塞性問題，使用 AskUserQuestion 詢問：
  - "發現 X 個未完成任務，是否要繼續進行發布檢查？"
  - 選項：
    1. "繼續檢查（任務將記錄在報告中）"
    2. "取消，讓我先完成這些任務"
    3. "將 Active todos 標記為 'Known Issues' 並繼續"

---

### 階段 1：專案類型識別

自動檢測以下檔案以判斷專案類型：
- `manifest.json` → Obsidian Plugin / Browser Extension
- `android/` + `build.gradle` → Android App
- `ios/` + `*.xcodeproj` → iOS App
- `electron-builder.yml` / `forge.config.js` → Electron App
- `package.json` + `bin` field → CLI 工具
- `docker-compose.yml` + `kubernetes/` → SaaS
- 其他 → Web App

若無法判斷或多重特徵，使用 AskUserQuestion 確認。

---

## 檢查清單矩陣

### 🧩 Obsidian Plugin

> **重要**：Obsidian Plugin 專案必須先依照 `OBSIDIAN_PLUGIN_DEVELOPMENT_RULES.md` 進行完整審查與修復，再執行以下檢查。

#### 階段 0.5：Obsidian 開發規範檢查（OBSIDIAN_PLUGIN_DEVELOPMENT_RULES.md）

**執行前置作業**：
1. 讀取專案根目錄或 Steering Docs 中的 `OBSIDIAN_PLUGIN_DEVELOPMENT_RULES.md`
2. 依照規則文件逐項檢查並自動修復問題
3. 產出修復報告

**必須檢查與修復的項目**：

##### manifest.json 規範
- [ ] **Plugin ID 規則**
  - 不得包含 "obsidian"
  - 不得以 "plugin" 結尾
  - 必須全小寫
- [ ] **Plugin Name 規則**
  - 不得包含 "Obsidian"
  - 不得以 "Plugin" 結尾
  - 不得以 "Obsi" 開頭或以 "dian" 結尾
- [ ] **Description 規則**
  - 不得包含 "Obsidian"
  - 不得以 "This plugin" 開頭
  - 必須以標點符號結尾（`.` `?` `!` `)`）
  - 應少於 250 字元
  - 必須與 GitHub repo description 完全一致

##### TypeScript 規範檢查
- [ ] **Async/Await 規則**
  - 無 floating promises（必須使用 `void` 或 `.catch()`）
  - Menu onClick 等回調使用 void IIFE 模式
  - 無 useless async（除非是 override method）
  - 無 await on non-Promise
- [ ] **型別安全**
  - 無 `any` 型別（改用 `unknown` + type guard）
  - 使用 `instanceof` 檢查型別，不直接 cast
  - 無未使用的變數或 import
  - 使用 `const`/`let`，禁止 `var`
- [ ] **this 綁定**
  - 傳遞方法作為 callback 時正確綁定 this
- [ ] **閉包型別收窄**
  - async IIFE 前將收窄後的值提取到區域變數

##### 已棄用 API 檢查（必須替換）
- [ ] `setClickableIcon()` → `setIcon()` + `clickable-icon` class
- [ ] `app.isMobile` → `Platform.isMobile`
- [ ] `fetch()` → `requestUrl()`
- [ ] `innerHTML` → `createEl()`
- [ ] `window.addEventListener` → `registerDomEvent()`
- [ ] `setInterval` → `registerInterval()`
- [ ] Node.js `fs`/`path`/`os` → `app.vault` API

##### 安全性規範
- [ ] 無 `innerHTML`/`outerHTML`/`insertAdjacentHTML` 處理使用者輸入
- [ ] 使用 `requestUrl()` 而非 `fetch()`
- [ ] 無 `eval()` 或 `new Function()`
- [ ] 無 regex lookbehind（會導致 iOS 崩潰）
- [ ] 使用 `normalizePath()` 處理使用者提供的路徑

##### 生命週期管理
- [ ] `onload()` 只做輕量初始化，重度工作放 `onLayoutReady`
- [ ] `onunload()` 不呼叫 `detachLeavesOfType()`
- [ ] 事件使用 `registerEvent`/`registerDomEvent`/`registerInterval`

##### UI/UX 規範
- [ ] 使用 CSS 變數而非硬編碼顏色
- [ ] UI 文字使用 sentence case
- [ ] 設定頁即時儲存（無 Save 按鈕）
- [ ] Command ID 不含 "command" 或 plugin ID

##### 無障礙設計（必須）
- [ ] 所有 icon button 有 `aria-label`
- [ ] 互動元素支援鍵盤導航
- [ ] 觸控目標至少 44×44px（行動裝置）
- [ ] 使用 `:focus-visible` 定義焦點指示器

##### 程式碼清理
- [ ] 移除所有 `console.log`（特別是 onload/onunload）
- [ ] 移除 sample plugin 樣板程式碼
- [ ] 移除範本註解和 placeholder 實作

---

#### 必要檢查項目（原有）
- [ ] **manifest.json 完整性**
  - `id`、`name`、`version`、`minAppVersion`、`author`
  - `description` 清晰且 < 250 字元
  - `isDesktopOnly` 或移動端支援聲明
- [ ] **版本號一致性**
  - `manifest.json`、`package.json`、`versions.json` 版本同步
  - 遵循 Semantic Versioning (semver)
- [ ] **程式碼品質**
  - 無 `console.log`、`debugger`、`TODO` 註解
  - 通過 ESLint/TypeScript 檢查
  - Bundle size < 2MB（建議 < 500KB）
- [ ] **API 相容性**
  - 使用的 Obsidian API 版本符合 `minAppVersion`
  - 無已棄用 API 呼叫（檢查 obsidian.d.ts）
- [ ] **發布檔案**
  - `main.js`、`manifest.json`、`styles.css`（選用）齊全
  - GitHub Release 包含正確檔案
  - `README.md` 包含安裝說明與截圖
- [ ] **社群規範**
  - 遵守 Obsidian Plugin Guidelines
  - 無資料收集或外部請求（或明確告知）
  - 依據專案內容完成隱私權政策中英文版撰寫（若有資料收集或外部請求）
  - License 檔案存在（建議 MIT）

#### 測試檢查
- [ ] 在 Obsidian Desktop 測試載入與基本功能
- [ ] 移動端測試（若支援）
- [ ] 與熱門插件相容性測試（Dataview、Templater 等）
- [ ] 設定遷移測試（若有更新）

---

### 🤖 Android App

#### 必要檢查項目
- [ ] **Gradle 配置**
  - `versionCode` 遞增
  - `versionName` 符合 semver
  - `minSdkVersion`、`targetSdkVersion` 符合政策（Google Play 要求 targetSdk 33+）
- [ ] **簽署配置**
  - Release keystore 已配置
  - ProGuard/R8 混淆規則測試
  - APK/AAB 簽署驗證
- [ ] **資源檢查**
  - App icon 各解析度齊全（mdpi ~ xxxhdpi）
  - Splash screen 適配 Android 12+
  - 字串資源無硬編碼
- [ ] **權限與隱私**
  - `AndroidManifest.xml` 權限最小化
  - 隱私權政策連結（Google Play 必須）
  - Data Safety 表單填寫完整
  - 依據專案內容完成隱私權政策中英文版撰寫
- [ ] **Google Play Console**
  - 截圖（手機 + 平板，最少 2 張）
  - Feature Graphic（1024x500）
  - App 說明完整且符合政策
  - 內容分級完成
- [ ] **效能與相容性**
  - 無記憶體洩漏（LeakCanary）
  - APK/AAB 大小 < 150MB（理想 < 50MB）
  - 支援多螢幕尺寸與折疊裝置

#### 測試檢查
- [ ] 在不同 Android 版本測試（最少 3 個版本）
- [ ] 各廠牌裝置測試（Samsung、Pixel、小米等）
- [ ] 內部測試軌 alpha/beta 測試
- [ ] Crash 報告工具集成（Firebase Crashlytics）

---

### 🍎 iOS App

#### 必要檢查項目
- [ ] **Xcode 配置**
  - Bundle Identifier 正確
  - Version (`CFBundleShortVersionString`) 與 Build Number (`CFBundleVersion`) 遞增
  - Deployment Target 設定合理（建議 iOS 15+）
- [ ] **簽署與憑證**
  - Distribution Certificate 有效
  - Provisioning Profile 正確
  - Push Notification / iCloud 等 Capabilities 配置
- [ ] **資源檢查**
  - App Icon 各尺寸齊全（包含 App Store 1024x1024）
  - Launch Screen 適配各裝置
  - 支援 Dark Mode（若適用）
- [ ] **隱私權與權限**
  - `Info.plist` 權限描述清晰（相機、位置等）
  - App Privacy Details 填寫完整
  - Privacy Policy URL
  - 依據專案內容完成隱私權政策中英文版撰寫
- [ ] **App Store Connect**
  - 截圖（iPhone + iPad，各 3-10 張）
  - App Preview 影片（選用但建議）
  - App 描述、關鍵字、分類
  - 聯絡資訊與支援 URL
- [ ] **技術要求**
  - 通過 App Store Review Guidelines
  - 無私有 API 使用
  - IPv6 網路支援
  - 64-bit 架構

#### 測試檢查
- [ ] TestFlight 內部測試
- [ ] 各裝置測試（iPhone SE、Pro Max、iPad）
- [ ] iOS 版本相容性測試
- [ ] Accessibility（VoiceOver）測試

---

### 🌐 Web App

#### 必要檢查項目
- [ ] **SEO 與 Metadata**
  - `<title>`、`<meta description>` 最佳化
  - Open Graph 與 Twitter Card 標籤
  - Sitemap.xml 與 robots.txt
  - Structured Data (JSON-LD)
- [ ] **效能優化**
  - Lighthouse Score: Performance > 90
  - First Contentful Paint (FCP) < 1.8s
  - Time to Interactive (TTI) < 3.8s
  - Cumulative Layout Shift (CLS) < 0.1
- [ ] **PWA 功能（若適用）**
  - `manifest.json` 配置
  - Service Worker 離線支援
  - Install prompt 最佳化
- [ ] **安全性**
  - HTTPS 強制啟用
  - Content Security Policy (CSP)
  - CORS 設定正確
  - 無混合內容警告
  - 依據專案內容完成隱私權政策中英文版撰寫
- [ ] **瀏覽器相容性**
  - 支援 Chrome、Firefox、Safari、Edge 最新版
  - Polyfills 配置（若需要）
  - Responsive 設計測試（手機、平板、桌面）
- [ ] **分析與監控**
  - Google Analytics / Plausible 設定
  - Error tracking（Sentry / Rollbar）
  - Real User Monitoring (RUM)

#### 測試檢查
- [ ] 各瀏覽器手動測試
- [ ] 不同裝置螢幕尺寸測試
- [ ] 網路限流測試（3G、4G）
- [ ] Accessibility (WCAG 2.1 AA)

---

### 💼 SaaS 平台

#### 必要檢查項目（包含 Web App 所有項目 +）
- [ ] **多租戶架構**
  - 資料隔離驗證
  - Tenant-specific 配置管理
  - 跨租戶資料洩漏測試
- [ ] **認證與授權**
  - SSO 整合（SAML、OAuth2、OIDC）
  - RBAC（角色權限控制）測試
  - Session 管理與逾時設定
  - 2FA/MFA 支援
- [ ] **計費與訂閱**
  - Stripe / Paddle 整合測試
  - 訂閱升降級流程
  - Invoice 生成與寄送
  - 試用期與取消政策
- [ ] **API 與整合**
  - API 文件完整（Swagger / OpenAPI）
  - Rate limiting 設定
  - Webhook 可靠性測試
  - API versioning 策略
- [ ] **合規性**
  - GDPR 資料匯出/刪除功能
  - SOC 2 / ISO 27001 要求（若適用）
  - Terms of Service 與 Privacy Policy
  - 依據專案內容完成隱私權政策中英文版撰寫
  - Cookie 同意橫幅
- [ ] **監控與維運**
  - Health check endpoints
  - Database backup 自動化
  - Disaster recovery 計畫
  - Status page（StatusPage.io / Atlassian）

#### 測試檢查
- [ ] Load testing（Apache JMeter / k6）
- [ ] Security penetration testing
- [ ] Disaster recovery 演練
- [ ] Customer onboarding flow 測試

---

### 💻 Electron App

#### 必要檢查項目
- [ ] **應用程式簽署**
  - Windows: Authenticode 簽署
  - macOS: Apple Developer ID 簽署與公證
  - Linux: 選用 GPG 簽署
- [ ] **安裝程式**
  - Windows: NSIS / Squirrel installer
  - macOS: DMG 背景圖與排版
  - Linux: AppImage / Snap / deb / rpm
- [ ] **Auto-update**
  - electron-updater 配置測試
  - Update server 可用性
  - 更新下載與安裝流程
  - Rollback 機制
- [ ] **資源與效能**
  - App icon 各平台齊全
  - Bundle size < 200MB（理想 < 100MB）
  - 記憶體使用 < 500MB（閒置）
  - Asar 打包與完整性
- [ ] **安全性**
  - `nodeIntegration: false`、`contextIsolation: true`
  - CSP 設定
  - 無 `eval()` 或危險模式
  - IPC 通道安全驗證
  - 依據專案內容完成隱私權政策中英文版撰寫
- [ ] **離線功能**
  - 無網路情況下核心功能可用
  - 本地資料持久化
  - Crash reporter（Sentry / BugSnag）

#### 測試檢查
- [ ] 各作業系統安裝與啟動測試
- [ ] 升級流程測試（從舊版升級）
- [ ] 高 DPI / Retina 顯示測試
- [ ] Multi-window 與 IPC 通訊測試

---

### 🔧 CLI 工具

#### 必要檢查項目
- [ ] **package.json 配置**
  - `bin` field 正確指向執行檔
  - `engines` 指定 Node.js 版本
  - `files` field 包含必要檔案（不含測試/範例）
  - Keywords 與 description 最佳化（npm 搜尋）
- [ ] **指令介面**
  - Help 文件完整（`--help` 或 `-h`）
  - 版本資訊（`--version` 或 `-V`）
  - 錯誤訊息清晰且具操作性
  - Progress indicators（ora / cli-progress）
- [ ] **跨平台相容性**
  - Windows、macOS、Linux 測試
  - 路徑處理使用 `path` 模組（不硬編碼 `/` 或 `\`）
  - 環境變數讀取（支援 `.env`）
  - POSIX 與 Windows shell 相容
- [ ] **套件發布**
  - npm publish 前測試（`npm pack`）
  - README 包含安裝與使用範例
  - CHANGELOG.md 更新
  - License 檔案（MIT / Apache 2.0）
- [ ] **安全性**
  - 無敏感資訊硬編碼
  - Dependencies 安全掃描（`npm audit`）
  - 輸入驗證與 sanitization
  - 避免 Shell injection（使用 `execa` 而非 `child_process.exec`）
- [ ] **API 整合（若適用）**
  - API token 管理（Keychain / credential storage）
  - Rate limiting 處理
  - Retry 與 exponential backoff
  - Offline mode 或 cache 機制

#### 測試檢查
- [ ] 各作業系統 E2E 測試
- [ ] CI/CD pipeline 測試（GitHub Actions）
- [ ] 與其他工具整合測試（作為 pipeline 一部分）
- [ ] 升級流程測試（global install）

---

## 共通檢查項目（所有專案類型）

### 🚦 專案管理與追蹤
- [ ] **todos.md 檢查**
  - 所有 Active todos 已完成或已評估為非阻塞
  - 無過期任務（Past Due）
  - 若有未完成任務，已記錄在「Known Issues」
  - Completed 區塊包含本版本完成的任務
- [ ] **TodoWrite 狀態**
  - 當前 session 無 pending/in_progress 任務
  - 所有開發中的 todos 已完成或轉移到 todos.md
  - 無遺漏的技術債務（technical debt）
- [ ] **Issue Tracker 同步**（若使用 GitHub/Jira）
  - Milestone 相關的 issues 已關閉或移到下個版本
  - 無 critical/blocker 優先級的 open issues
  - Release notes 包含所有關閉的 issues

### 📝 文件與規範
- [ ] **README.md** 包含：
  - 專案簡介與核心功能
  - 安裝說明（一鍵複製指令）
  - 使用範例與截圖/GIF
  - 常見問題 (FAQ)
  - 貢獻指南連結
- [ ] **CHANGELOG.md** 更新本版本異動
- [ ] **LICENSE** 檔案存在且正確
- [ ] **版本號** 統一（package.json、manifest、app config）
- [ ] **環境變數範例**（`.env.example`）

### 🧪 測試與品質
- [ ] 所有測試通過（unit + integration + e2e）
- [ ] Code coverage > 80%（核心邏輯 > 95%）
- [ ] Linter 無錯誤（ESLint / Pylint / RuboCop）
- [ ] TypeScript 型別檢查通過（`tsc --noEmit`）
- [ ] 無 deprecated dependencies

### 🔒 安全性
- [ ] **敏感資訊檢查**
  - 無 API keys、tokens、passwords 硬編碼
  - `.gitignore` 包含 `.env`、`secrets/`、`*.key`
  - Git history 無敏感資訊（使用 `gitleaks` 掃描）
- [ ] **依賴套件**
  - `npm audit` / `yarn audit` 無 high/critical 漏洞
  - 定期更新策略（Dependabot / Renovate）
  - 無未使用的依賴（`depcheck`）
- [ ] **第三方服務**
  - API endpoints 使用 HTTPS
  - Secrets 使用環境變數或 Vault
  - CORS 白名單設定

### 📦 建置與部署
- [ ] **建置流程**
  - Production build 成功（`npm run build`）
  - 無 source maps 洩漏（或僅內部可存取）
  - Bundle 分析（webpack-bundle-analyzer）
  - Tree-shaking 有效運作
- [ ] **CI/CD**
  - GitHub Actions / GitLab CI 通過
  - 自動化測試執行
  - Deploy preview 可用（Vercel / Netlify）
- [ ] **監控準備**
  - Error tracking 設定（Sentry）
  - Logging 機制（結構化 logs）
  - Performance monitoring（若適用）

### 🎨 使用者體驗
- [ ] **無障礙設計（Accessibility）**
  - 鍵盤導航可用
  - ARIA labels 完整
  - 色彩對比符合 WCAG AA（4.5:1）
  - Screen reader 測試
- [ ] **本地化（i18n）**
  - 無硬編碼字串（英文以外）
  - 翻譯檔案完整（若支援多語言）
  - Date/time/number 格式本地化
- [ ] **錯誤處理**
  - 使用者友善的錯誤訊息
  - Fallback 機制（網路失敗、資源載入失敗）
  - Graceful degradation

---

## 輸出格式

### Markdown 報告（預設）

生成於 `docs/releases/PRE_RELEASE_CHECKLIST_v{version}.md`：

```markdown
# Pre-Release Checklist - v1.2.3
Generated: 2025-12-04 14:30:00

## 專案資訊
- Type: Obsidian Plugin
- Version: 1.2.3
- Previous Version: 1.2.2

## 🚦 Todo 狀態檢查

### todos.md 狀態
- **Total Active**: 2
- **Past Due**: 1
- **Blockers**: 0
- **Status**: ⚠️ Warning

#### Active Tasks:
1. [ ] Fix memory leak in data sync | Due: 12/03/2025 ❌ OVERDUE
2. [ ] Update API documentation

**評估**: 發現 1 個過期任務。建議修復後再發布。

### TodoWrite Status
- **Current Session Todos**: 0
- **Status**: ✅ Clean

---

## 檢查結果摘要
- ✅ Passed: 42
- ⚠️  Warnings: 4 (包含 todo 警告)
- ❌ Failed: 1

## 必須處理
### ❌ Bundle size exceeds limit
- Current: 2.3MB
- Limit: 2MB
- Suggestion: 分析 webpack bundle 並移除未使用的依賴

## 警告項目
### ⚠️ Unfinished todos in todos.md
- Active: 2 tasks
- Overdue: 1 task
- Action: 完成或評估為非阻塞性任務

### ⚠️ Missing mobile testing
- Action: 在 Obsidian Mobile 測試基本功能

---

## 詳細檢查報告
[完整 checklist 內容...]

---

## 📋 Known Issues (from todos.md)
若選擇「將 Active todos 標記為 Known Issues」，會列在此：
- Fix memory leak in data sync (Target: v1.2.4)
```

### JSON 報告（`--output=json`）

生成於 `docs/releases/pre-release-check-v{version}.json`：

```json
{
  "version": "1.2.3",
  "type": "obsidian-plugin",
  "timestamp": "2025-12-04T14:30:00Z",
  "todos": {
    "todosMd": {
      "active": 2,
      "pastDue": 1,
      "blockers": 0,
      "status": "warning",
      "tasks": [
        {
          "description": "Fix memory leak in data sync",
          "dueDate": "2025-12-03",
          "overdue": true
        },
        {
          "description": "Update API documentation",
          "dueDate": null,
          "overdue": false
        }
      ]
    },
    "todoWrite": {
      "pending": 0,
      "inProgress": 0,
      "status": "clean"
    }
  },
  "summary": {
    "passed": 42,
    "warnings": 4,
    "failed": 1
  },
  "items": [
    {
      "id": "todo-01",
      "category": "project-management",
      "status": "warning",
      "message": "2 active todos found, 1 overdue"
    },
    {
      "id": "obs-01",
      "category": "manifest",
      "status": "passed",
      "message": "manifest.json is valid"
    }
  ],
  "knownIssues": [
    {
      "description": "Fix memory leak in data sync",
      "targetVersion": "1.2.4",
      "source": "todos.md"
    }
  ]
}
```

---

## 實作注意事項

1. **Todo 檢查優先執行**
   - **階段 0** 必須最優先執行（在專案類型識別之前）
   - 使用 Read 工具讀取 `todos.md`（位於專案 root）
   - 解析 markdown 格式，區分 Active 與 Completed 區塊
   - 檢查當前 TodoWrite session 狀態
   - 若發現阻塞性問題，使用 AskUserQuestion 取得使用者確認

2. **Obsidian Plugin 專案特殊處理（階段 0.5）**
   - 當偵測到專案類型為 Obsidian Plugin 時，必須執行此階段
   - 讀取 `OBSIDIAN_PLUGIN_DEVELOPMENT_RULES.md`（優先順序：專案 root → Steering Docs）
   - **自動修復模式**：不只檢查，要主動修復可自動修復的問題
   - 使用 Grep 搜尋違規模式，使用 Edit 工具修復

   **自動修復範例**：
   ```typescript
   // 搜尋並修復 floating promises
   // 搜尋：callback: async () => { await
   // 修復為：callback: () => { void (async () => { await ... })(); }

   // 搜尋並替換已棄用 API
   // 搜尋：app.isMobile
   // 修復為：Platform.isMobile（並確保 import { Platform } from 'obsidian'）

   // 搜尋：fetch(
   // 修復為：requestUrl(（並確保 import { requestUrl } from 'obsidian'）
   ```

   **修復優先順序**：
   1. manifest.json 問題（ID、name、description 規範）
   2. 已棄用 API 替換（安全性問題優先）
   3. TypeScript 規範問題（floating promises、any 型別等）
   4. UI/UX 與無障礙問題
   5. 程式碼清理（console.log、未使用變數等）

   **產出修復報告**：
   ```markdown
   ## 🔧 Obsidian Plugin 規範修復報告

   ### 自動修復項目
   - ✅ 替換 `app.isMobile` → `Platform.isMobile`（3 處）
   - ✅ 修復 floating promise in `main.ts:45`
   - ✅ 移除 `console.log`（5 處）

   ### 需手動處理項目
   - ⚠️ `manifest.json` description 與 GitHub repo 不一致
   - ⚠️ 缺少 `aria-label` on icon buttons（建議加在 `src/ui/Toolbar.ts:23`）

   ### 無法自動修復（需人工判斷）
   - ❓ `any` 型別在 `src/services/parser.ts:78`（需設計適當型別）
   ```

3. **Todo 解析邏輯**
   ```typescript
   // 偵測 blocker 關鍵字
   const blockerKeywords = ['blocker', 'critical', 'MUST FIX', 'blocking'];

   // 解析 Due date
   const dueDatePattern = /Due:\s*(\d{2}\/\d{2}\/\d{4})/;

   // 檢查是否過期
   const isOverdue = dueDate && new Date(dueDate) < new Date();
   ```

4. **遵循 CLAUDE.md 規範**
   - 執行前讀取 `ARCHITECTURE.md`（若存在）
   - 使用 TodoWrite 追蹤檢查進度（建議建立檢查項目 todo list）
   - 使用 Glob/Grep/Read 工具（不用 bash find/grep）

5. **不自動修正問題（一般專案）**
   - 僅產出報告，讓使用者決定如何處理
   - 提供具體建議與參考連結
   - **例外 1**：可提供「將 todos.md Active 任務轉為 Known Issues」的選項
   - **例外 2**：Obsidian Plugin 專案會主動執行自動修復（見第 2 點）

6. **檔案輸出位置**
   - 預設：`docs/releases/` 目錄
   - 若目錄不存在，自動建立
   - 絕不放在 root 目錄
   - 報告檔名格式：`PRE_RELEASE_CHECKLIST_v{version}_{timestamp}.md`

7. **可擴展性**
   - 檢查項目應可透過外部設定檔擴展（`.claude/pre-release-config.json`）
   - 支援自訂規則與閾值
   - 可自訂 blocker 關鍵字與 todo 數量閾值

8. **效能考量**
   - 長時間執行的測試（e2e、load testing）預設跳過
   - 提供 `--full` flag 執行完整檢查
   - Todo 檢查應該非常快速（< 1 秒）

---

## 使用範例

### 基本使用

```bash
# 基本使用（自動偵測專案類型，包含 todo 檢查）
/pre-release-check

# 指定類型並產出 JSON
/pre-release-check --type=cli --output=json

# 完整檢查（包含長時間測試）
/pre-release-check --full
```

### 進階選項

```bash
# 僅檢查 todos，不執行其他檢查
/pre-release-check --only=todos

# 跳過 todo 檢查（不建議，但可用於緊急情況）
/pre-release-check --skip=todos

# 僅檢查安全性項目
/pre-release-check --only=security

# 排除特定檢查
/pre-release-check --skip=tests,performance

# 強制通過（即使有 todos 也繼續）
/pre-release-check --force
```

### 互動式流程範例

```
使用者執行：/pre-release-check

Claude 輸出：
🚦 檢查 todos.md...
  發現 3 個 Active todos，其中 1 個已過期

  Active Tasks:
  1. [ ] Fix memory leak in data sync | Due: 12/03/2025 ❌ OVERDUE
  2. [ ] Update API documentation
  3. [ ] Add error handling to webhook

⚠️ 發現 3 個未完成任務，是否繼續進行發布檢查？

[使用者選擇]
1. 繼續檢查（任務將記錄在報告中）  ← 選擇此項
2. 取消，讓我先完成這些任務
3. 將 Active todos 標記為 'Known Issues' 並繼續

---

繼續執行完整檢查...
✓ 偵測到專案類型：Obsidian Plugin
✓ 檢查 manifest.json...
✓ 檢查程式碼品質...
⚠️ 發現 2 個警告

生成報告：docs/releases/PRE_RELEASE_CHECKLIST_v1.2.3_20251204.md
```

---

## 整合建議

將此 command 加入發布 workflow：

```yaml
# .github/workflows/pre-release.yml
name: Pre-Release Check
on:
  push:
    tags:
      - 'v*'
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run pre-release check
        run: claude /pre-release-check --output=json
      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: pre-release-report
          path: docs/releases/*.json
```

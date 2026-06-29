# /release-note - 功能完成後自動更新版號與 Release Notes

當功能開發完成時，自動同步更新以下檔案：
- `package.json` 版號
- `src/lib/constants/app.ts` 前台 APP_VERSION 常數（admin/ops 後台左上角版號按鈕顯示來源）
- `RELEASE_NOTE.md` 開發紀錄
- `src/lib/data/releaseNotes.ts` 前台顯示紀錄

## 執行指令

```bash
# 基本使用（預設 patch 版號）
/release-note "新增物件損益計算機功能"

# 指定版號類型
/release-note --patch "修復管家機器人查詢問題"     # 0.6.2 → 0.6.3
/release-note --minor "新增租金自動調整功能"      # 0.6.2 → 0.7.0
/release-note --major "重構多租戶架構"            # 0.6.2 → 1.0.0

# 指定類別（新功能/修復/改進/技術）
/release-note --type=feature "新增管家機器人物件查詢"
/release-note --type=fix "修復日期選擇器顯示問題"
/release-note --type=improvement "優化 AI 設定頁面導航"
/release-note --type=technical "升級 react-day-picker 至 v9"

# 組合使用
/release-note --minor --type=feature "新增物件損益計算機"
```

---

## 執行流程

### 階段 1：讀取當前版本資訊

1. **讀取 package.json**
   - 取得當前版本號（如 `0.6.2`）
   - 依據參數計算新版號

2. **讀取現有 Release Notes 與版號常數**
   - 讀取 `src/lib/constants/app.ts` 確認 APP_VERSION
   - 讀取 `RELEASE_NOTE.md` 確認格式
   - 讀取 `src/lib/data/releaseNotes.ts` 確認結構

### 階段 2：使用者輸入確認

使用 AskUserQuestion 詢問：

**若只提供描述，未指定類別：**
```
請選擇此更新的類別：
1. 🎉 新增功能 (feature)
2. 🐛 問題修復 (fix)
3. 🚀 優化改進 (improvement)
4. 🛠️ 技術調整 (technical)
```

**確認版號與內容：**
```
即將更新版本：0.6.2 → 0.6.3

更新內容：
- 類別：新增功能
- 描述：新增物件損益計算機功能

是否繼續？
```

### 階段 3：更新檔案

#### 3.1 更新 package.json

```json
{
  "version": "0.6.3"  // 更新版本號
}
```

#### 3.2 更新 src/lib/constants/app.ts

此檔案為 admin 與 ops 後台介面左上角可點擊版號按鈕的顯示來源，務必同步更新：

```typescript
export const APP_VERSION = '0.6.3'  // 更新為新版號
```

#### 3.3 更新 RELEASE_NOTE.md

在檔案開頭（`# Release Notes` 之後）新增：

```markdown
## v0.6.3 (2026-02-05)

### 🎉 新增功能 (New Features)
- **物件損益計算機**: 新增物件損益計算機功能，支援租金收入與支出分析。

---

## v0.6.2 (2026-02-05)
...
```

若同一天已有相同版本，則追加到對應類別區塊。

#### 3.4 更新 src/lib/data/releaseNotes.ts

在 `RELEASE_NOTES` 陣列開頭新增：

```typescript
{
    version: '0.6.3',
    date: '2026-02-05',
    title: '物件損益計算機',
    features: [
        '物件損益計算機：新增物件損益計算機功能，支援租金收入與支出分析。'
    ],
    fixes: [],
    improvements: []
},
```

若同日已有相同版本，則追加到對應陣列。

---

## 類別對應表

| 參數 | RELEASE_NOTE.md 標題 | releaseNotes.ts 欄位 |
|------|---------------------|---------------------|
| `feature` | 🎉 新增功能 (New Features) | `features` |
| `fix` | 🐛 問題修復 (Fixes) | `fixes` |
| `improvement` | 🚀 優化與改進 (Improvements) | `improvements` |
| `technical` | 🛠️ 技術調整 (Technical Changes) | 歸入 `improvements` 並加前綴 `[技術]` |

---

## 輸出範例

```
✅ Release Note 更新完成！

版本：0.6.2 → 0.6.3
日期：2026-02-05

更新內容：
- 🎉 新增功能：物件損益計算機 - 新增物件損益計算機功能，支援租金收入與支出分析。

已更新檔案：
- ✅ package.json (version: 0.6.3)
- ✅ src/lib/constants/app.ts (APP_VERSION: 0.6.3)
- ✅ RELEASE_NOTE.md
- ✅ src/lib/data/releaseNotes.ts

下一步建議：
1. 執行 `npm run build` 確認建置正常
2. 執行 `git add -A && git commit -m "chore(release): bump version to 0.6.3"`
3. 執行 `/pre-release-check` 進行發布前檢查
```

---

## 進階功能

### 批次新增多項更新

```bash
/release-note --batch
```

進入互動模式，可連續輸入多項更新後一次提交：

```
輸入更新內容（輸入空行結束）：
> feature: 新增物件損益計算機
> fix: 修復日期選擇器顯示問題
> improvement: 優化 AI 設定頁面導航
>

確認新增 3 項更新至 v0.6.3？
```

### 從 Git Diff 自動偵測

```bash
/release-note --auto
```

自動分析最近的 git commits 並建議 release notes 內容。

---

## 實作注意事項

1. **版本號格式**
   - 遵循 Semantic Versioning (semver)
   - 格式：`MAJOR.MINOR.PATCH`

2. **日期格式**
   - RELEASE_NOTE.md: `YYYY-MM-DD`
   - releaseNotes.ts: `YYYY-MM-DD`

3. **同版本追加邏輯**
   - 若當天已有相同版本的 release note
   - 不建立新區塊，而是追加到現有區塊
   - 避免重複的版本號

4. **標題自動生成**
   - releaseNotes.ts 的 `title` 欄位
   - 取第一個 feature 的關鍵詞
   - 或使用 AskUserQuestion 讓使用者自訂

5. **檔案編碼**
   - 使用 UTF-8 編碼
   - 確保中文字元正確顯示

6. **TypeScript 語法**
   - releaseNotes.ts 中的陣列項目需正確使用逗號
   - 字串使用單引號 `'`

7. **錯誤處理**
   - 若檔案不存在，提示使用者
   - 若格式異常，顯示警告並詢問是否繼續

---

## 相關檔案

- `package.json` - 版本號來源
- `src/lib/constants/app.ts` - 前台 APP_VERSION 常數（admin/ops 後台左上角版號按鈕顯示來源）
- `RELEASE_NOTE.md` - 開發者 Release Notes（Markdown）
- `src/lib/data/releaseNotes.ts` - 前台顯示 Release Notes（TypeScript）

---

## 與其他指令整合

建議工作流程：

1. 完成功能開發
2. 執行 `/release-note "功能描述"` 更新版號與紀錄
3. 執行 `/pre-release-check` 進行發布前檢查
4. 確認無誤後 commit 並 push

# 0206. 三欄模式：身分元件上移標題列（可拖曳、隨標題列動作）

- 狀態：已接受
- 日期：2026-07-19
- 相關文件：`apps/desktop/src/ui/titlebar-controls.ts`、`apps/desktop/src/ui/TitleBar.tsx`、`apps/desktop/src/titlebar.tsx`、`apps/desktop/src/App.tsx`、`apps/desktop/src/ui/SettingsPanel.tsx`、ADR-0151（自繪標題列雙帶模型）、ADR-0153（autoHide）、ADR-0167（標題列風格）

## 背景與問題

三欄（modern）模式在標題列**下方**另有一條 `.idbar`：身分切換器、＋新增身分、🔒 解鎖隱藏、🗂 名冊管理、以及最左的人 icon。回報希望把這些**整合進標題列**，隨標題列一起動作（autoHide/風格）、並能用標題列的拖曳設定調整位置。

難點：標題列（`WindowChrome`）在 `main.tsx` 根層、**在 App 之外**；身分狀態（profiles/切換/新增/解鎖/名冊）在 App 內。既有 `useRegisterSettingsOpener`（App 把「開設定」註冊給標題列的 ⚙）即同類橋接先例。

## 決策

把身分元件變成**一等標題列控制項**（可拖曳），僅在**三欄＋Tauri**渲染於標題列。

1. **控制項模型**（`titlebar-controls.ts`）：`ControlId` 增 `identity`／`addid`／`unlockhidden`／`roster`。`WINDOW_CONTROL_IDS`（視窗控制，一律可用）與 `IDENTITY_CONTROL_IDS` 分開；解析時視窗控制缺漏補右帶（不變，維持 ADR-0152 遷移），**身分控制缺漏補左帶尾**＝舊設定升級自動帶入。人 icon 併入切換器（切換器本就顯示身分圖示）。
2. **Context 橋接**（`titlebar.tsx`）：新增 `identityControls: IdentityControlsBundle | null` 與 `useRegisterIdentityControls`（比照 registerSettingsOpener）。App 於三欄＋Tauri 註冊渲染資料（options/active/switchLabel/onSwitch/onAdd/unlock/roster），其餘情境傳 `null`。
3. **標題列渲染**（`TitleBar.tsx`）：`identity`→緊湊 `<select>` 切換器；`addid`/`unlockhidden`/`roster`→`titlebar__btn`。身分控制**未註冊或條件不符**（`unlock`/`roster` 為 null）即略過——即使在配置的帶上。
4. **App**（`App.tsx`）：三欄＋Tauri 時註冊 bundle **且不畫 `.idbar`**；經典/瀏覽器照舊畫 idbar（含瀏覽器的 ⚙）。
5. **拖曳編輯器**（`SettingsPanel.tsx`）：glyph/label 補齊四顆身分控制項（👤/＋/🔒/🗂），成為可拖曳拼塊；位置存在同一份標題列設定（身分層覆寫、裝置層回退，ADR-0167）。

## 理由

- 沿用既有雙帶＋拖放＋autoHide/風格模型＝身分控制自動獲得「隨標題列動作、可拖曳、風格套用」，零新機制。
- Context 橋接維持「標題列在根層、狀態在 App」的分層——App 只注入資料與處理器。
- 條件式渲染（未註冊/`null`）讓經典模式、瀏覽器、非企業主、無隱藏身分等情境自然退化。

## 後果

- 正面：三欄模式標題列即身分列，省一條橫欄、行為統一（可拖曳/自動隱藏一起）。
- 中性 / 已知殘餘：
  - 拖曳編輯器在**任何模式**都顯示身分拼塊（配置共用）；經典/瀏覽器拖動只是預存位置、實際不渲染。
  - 編輯器以 👤 代表 `identity` 的位置，實際標題列渲染為切換器（寬度不同）＝位置預覽、非像素級 WYSIWYG。
  - 身分控制僅三欄＋Tauri 渲染；經典模式仍走 idbar（本 ADR 不動經典）。
- 後續：需重建桌面方於安裝版生效。日後若要經典模式也整合可另議。

# 0130. UI 測試補上「會跑 useEffect」的環境——關掉 SSR-only 的測試盲區

- 狀態：已接受（已實作）
- 日期：2026-07-15
- 相關文件：**ADR-0122（那個 P0 就藏在開機 effect 裡、躲過所有測試）**、0119（健檢：本盲區於該次記錄）

## 背景與問題

這個專案**所有** UI 測試都用 `renderToStaticMarkup`（React 伺服器端渲染，SSR）在 **node 環境**跑。
SSR 只渲染一次靜態 HTML，**`useEffect` 從不執行**。於是任何寫在 effect 裡的邏輯——開機自動登入、
已讀回條觸發、主題套用到 DOM、通知掛載——**零測試覆蓋**。

這不是假設性的風險：**ADR-0122 那個「瀏覽器重載把你換成另一個人」的 P0，就藏在開機的
`useEffect` 裡**，因此躲過了所有 UI 測試。當時只能靠手動實測抓到，並在 ADR-0122 寫下
「測試不測 UI，測那條路徑的實質」——那是**繞過**盲區，不是**關掉**它。本 ADR 關掉它。

## 決策

### 1. 逐檔切到 jsdom，不動既有的 305 個 SSR 測試

vitest 支援檔案頂端的 `// @vitest-environment jsdom` **逐檔**指定環境。所以全域環境維持 `node`
（既有 SSR 測試一個都不改、不churn），只有**新的** effect 測試檔標記為 jsdom。additive，零遷移風險。

### 2. 用 `createRoot` ＋ `act`，不引入 @testing-library

`react-dom/client` 的 `createRoot` ＋ `react` 的 `act`（React 18.3 已把 `act` 從 test-utils 移進
`react`）就能**真的掛載元件、沖刷 effect、模擬互動與重渲染**——`react-dom` 本來就在，不必新增
測試框架相依。抽成 `src/test/jsdom-mount.ts` 的 `mount(element)`（回傳 `container`/`rerender`/
`unmount`）。

一併在 helper 裡：設 `IS_REACT_ACT_ENVIRONMENT`（否則 effect 排程會警告或不被沖刷），並裝一個
Map-backed 的 `localStorage` shim（jsdom 在 node 22 下未穩定暴露 `localStorage` 全域——與既有
SSR 測試同一招）。

### 3. 先釘住「已讀觸發」——最能代表這個盲區的一段

```ts
useEffect(() => { onMarkRead?.(); }, [contact.pubkey, messages.length, onMarkRead]);
```

開對話／新訊息到達時送已讀回條、清未讀徽章（ADR-0058）——寫在 effect 裡，SSR 完全碰不到。
新測試在 jsdom 掛載 `ConversationWindow`（真的 `I18nProvider`＋`ThemeProvider`），驗證：
開窗**觸發一次**、`messages.length` 變動**再觸發**、同一批訊息重渲染**不重複觸發**。這是 ADR-0122
那類 effect bug 的同一個盲區——現在測得到了。

同時補上兩個 provider 的 DOM 套用 effect（`data-theme`、`--accent` CSS 變數）——它們「有沒有真的
套到 DOM」過去也零測試。

## 理由

- 這不是加測試覆蓋率的數字遊戲，是**關掉一整類 bug 的溫床**。ADR-0119/0122 反覆講的失敗模式
  「安靜地做錯的事」，有一個大出口正是「效果寫在 effect 裡、而測試從不跑 effect」。
- 選 jsdom + `createRoot`/`act`（而非 @testing-library）是為了**最小相依、最小churn**：不新增測試
  框架、不遷移既有測試、不改全域環境。能力就位後，之後任何 effect 都能加測試。

## 後果

- 正面：
  - **effect 驅動的行為現在測得到**——已讀觸發、主題/主色套用到 DOM 都有真正掛載的測試。
  - 既有 305 個 SSR 測試**完全不動**（逐檔切環境）；`mount()` helper 供後續 effect 測試沿用。
  - jsdom 是 devDependency，**不進生產 bundle**（只被 `*.test` 引用，vite build 不含）。
  - 測試 1037 → **1045**（desktop +8：主題 DOM 套用 ×3、主色 CSS 變數 ×2、已讀觸發 ×3）。

- 已知限制：
  - **App.tsx 的開機 effect 本身仍未在 jsdom 測**——它要 mock 整個 Tauri／engine，成本高；
    其**邏輯**已由 ADR-0122 的 `browser-identity.test.ts`（真 store＋真 backend）覆蓋，
    缺的只是「React effect 有沒有呼叫那段邏輯」的最後一哩。能力已就位，待需要時補。
  - **行動端（react-native-web）尚未套用**——同一個模式適用（RN-web 也渲染到 DOM），
    可增量加上；本 ADR 先在桌面（P0 發生地）建立模式。

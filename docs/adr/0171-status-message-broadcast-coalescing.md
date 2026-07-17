# 0171. 自訂狀態文字廣播節流——UI 層合併逐字輸入，引擎維持同步廣播

- 狀態：已接受（已實作）
- 日期：2026-07-17
- 相關文件：ADR-0142（自訂狀態文字／正在聽）、0129（狀態改變封裝送在線無 P2P 聯絡人）、
  0109（自適應心跳）、0168/0169（行動端對齊）、程式碼審查發現 #5

## 背景與問題

程式碼審查（ADR-0169 批次）發現：自訂狀態文字輸入是**逐字**觸發 `onStatusMessage`，
每個按鍵都呼叫引擎 `setStatus(status, message)`；而 `RelayChatBackend.setStatus`
（`relay-backend.ts:1958`）**每次呼叫都同步**跑 `beat()`＋`broadcastPresenceState()`，
**沒有 debounce**。後果：

- **效率**：打一句話 = 對所有 P2P 通道逐字送心跳、對在線無 P2P 的聯絡人逐字送封裝事件。
- **隱私**：把「打到一半」的狀態文字（「在」→「在忙」→「在忙碌」…）一路廣播出去。

先前的註解誤稱「引擎節流心跳」，與事實不符。

## 考量的選項

- **A：在引擎 `setStatus` 加 debounce。** 否決——`setStatus` 的**同步廣播是刻意契約**：
  ADR-0129 的 catch-up（剛上線的聯絡人被補送當下狀態）與多條引擎測試
  （`relay-backend.test.ts:2658+`）都依賴「呼叫後狀態立即送達」。改成非同步會破壞語意與測試。
- **B：UI 改成「離開輸入框才送」（commit-on-blur，如正在聽）。** 否決——切分頁未觸發 blur
  時，新文字雖已本機記住卻不會廣播，聯絡人要到下次 `setStatus` 才看到，有資料抵達缺口。
- **C：在 UI／接線層節流廣播（採用）。** 本機狀態與持久化即時更新（輸入不卡、不丟），
  只把**網路廣播**合併：停手 ~600ms 才 `setStatus` 一次。

## 決策（選項 C）

行動端 `MobileApp.changeStatusMessage`：

- `setSelfStatusMessage(msg)` 與 `persistPresence(...)` **即時**（localStorage 廉價；打到一半
  關 App 也不丟，且下次上線以 `initialStatusMessage` 還原＝ADR-0168）。
- `backend.setStatus(selfStatus, msg)` 走 **~600ms debounce**（`statusBcTimer`）：逐字輸入
  只在停手後送出**目前**文字一次。
- **離散狀態變更**（online/away/busy）走 `changeStatus`＝**立即**廣播，並清掉待送的文字
  計時器（併入這次廣播，避免隨後又用舊狀態重播）。
- 計時器於**卸載／登入／登出**一律清除（與 typing 計時器同批收尾）。

引擎 `setStatus` 維持同步廣播不動（catch-up 契約與測試不受影響）。

## 後果

- 正面：狀態文字不再逐字打中繼/P2P、也不外送半成品文字；離散狀態變更仍即時；輸入零延遲、
  本機記憶零丟失。引擎零改動＝零迴歸風險。
- 已知限制／取捨：
  - **桌面端仍逐字廣播**（`DeckSidebar`/`ContactListWindow` 的 `onChange` 直送）。本 ADR
    只先修行動端；桌面可比照在 UI 層加同樣節流（後續，非本批）。行動端因此比桌面「更省」，
    非有害分歧。
  - 節流視窗內若使用者一直打字不停手（>session 不可能），該 session 聯絡人看不到最新文字；
    實務上停手即送、換狀態即送、下次上線亦還原，無實質影響。
  - 未加自動化測試（節流為計時器行為，行動端測試為 SSR、無 fake timer 接線點）；邏輯單純，
    以 typecheck＋人工推理把關，行為記於本 ADR。

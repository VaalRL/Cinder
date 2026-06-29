這是一份基於我們上述所有技術探討與架構決策，所彙整出的系統技術規格與架構總結書。此規格書直接對齊現代 TypeScript、React 與 Rust Tauri 的技術堆疊，並為未來整合本機 AI Agent（如透過 Model Context Protocol 進行對話檢索與 RAG）預留了完美的純本機資料庫基礎。

---

# 去中心化即時通訊軟體 (專案代號：Nostr Buddy) 技術規格書

## 1. 系統概述

本專案旨在開發一款具備極致隱私、無中央資料庫（Serverless），且高度還原早期 MSN Messenger 經典互動體驗（如震動、音樂狀態）的跨平台即時通訊軟體。系統透過融合 Nostr 協議與 WebRTC 技術，達成「零伺服器維護成本」的營運目標。

## 2. 核心架構設計 (雙軌混合網路)

系統將網路通訊拆分為「狀態與信令」及「巨量資料傳輸」雙引擎，並根據連線狀態動態切換：

* **引擎 A：Nostr 協議 (Cloudflare Workers + D1)**
* **定位：** 負責離線留言暫存、線上狀態廣播、以及 WebRTC 的初始信令交換。
* **資料生命週期 (NIP-40)：** 所有寫入 Cloudflare D1 的加密訊息皆押上 7 天的過期時間戳（Expiration Timestamp）。中繼站定時自動銷毀資料，確保永久免費額度不被耗盡。
* **無狀態廣播 (Ephemeral Events)：** 種類 20000-29999 的事件（線上狀態、正在聆聽音樂、WebRTC SDP 交換）僅做記憶體轉發，絕不寫入資料庫，達成零消耗。


* **引擎 B：WebRTC 直連 (點對點 P2P)**
* **定位：** 負責即時互動與大流量傳輸。
* **無縫升級：** 雙方上線並透過 Nostr 完成 SDP 交換後，即刻打通 P2P 資料通道。後續的「震動 (Nudge)」、「動畫快遞」與大檔案傳輸皆繞過中繼站，達成毫秒級延遲。



## 3. 終端平台與儲存策略

為確保端到端加密的完整性與避免資料遺失，徹底捨棄缺乏持久儲存權限的網頁版（Web）。

* **桌面端 (Rust Tauri + React/TypeScript)：** 作為系統的第一優先平台。擁有作業系統底層權限，可完美執行背景 WebSocket 長連線，並將對話紀錄與金鑰永久寫入本機原生 SQLite。
* **行動端 (React Native + SQLite)：** 作為輔助平台。受限於 iOS/Android 背景休眠機制，需透過 Cloudflare Worker 存放 APNs / FCM 憑證，以「無聲推播 (Silent Push)」喚醒 App，進行背景資料拉取與同步。
* **資料庫架構：** 以純本機 SQLite 為「唯一真相來源 (Source of Truth)」。這為未來實作本地 AI 助理（直接讀取結構化 JSON 對話紀錄進行 RAG 摘要）提供了絕對隱私的封閉環境。

## 4. 帳號、身分與多設備同步機制

* **零知識身分驗證：** 捨棄傳統帳號密碼。首次開啟軟體時，於本機端隨機生成 Ed25519 橢圓曲線公私鑰對。公鑰（`npub`）即為全網唯一 ID，顯示名稱允許無限重複（Zooko 三角難題之妥協方案）。
* **多設備同步 (QR Code + 連線競速)：**
* 手機掃描電腦端 QR Code 時，QR Code 僅包含「一次性 AES 金鑰」、「內網 IP (LAN)」與「WebRTC 房間號 (WAN)」。
* 實作 **Happy Eyeballs 競速演算法**：手機端同時發起區網 TCP 直連與外網 WebRTC 打洞請求，優先連通者負責將數十 MB 的 SQLite 資料庫與私鑰整包加密傳輸至手機。


* **極端災難復原：** **不提供** 12 字助記詞（BIP-39）或其他備份機制。貫徹極致隱私與零責任歸屬，設備與本機資料庫全毀即代表帳號永久死亡。

## 5. 經典功能還原對照表

| 功能項目 | 實作底層協定 | 運作機制與特性 |
| --- | --- | --- |
| **離線文字留言** | Nostr (Kind 4/44) | 透過本機私鑰加密後存入 Cloudflare，對方上線時拉取解密。 |
| **好友上線/離線** | Nostr (Kind 20000) | 每 30 秒發送心跳包，純轉發不存資料庫。斷線 60 秒即判定離線。 |
| **正在聆聽音樂** | Nostr (Kind 20000) | 讀取系統 API 後作為狀態字串廣播，即時渲染於好友介面。 |
| **正在輸入中...** | Nostr (Kind 20001) | 對話視窗觸發，透過中繼站轉發事件。 |
| **震動 (Nudge)** | WebRTC Data Channel | 必須在 WebRTC 連線狀態下觸發，確保毫秒級的視窗物理震動同步感。 |
| **檔案傳輸** | WebRTC Data Channel | 不受 Cloudflare JSON 大小限制，速度僅受雙方 ISP 頻寬影響。 |

---

### 預期與事實的區分

* **預期：** 開發者與市場普遍預期，去中心化且跨平台的通訊軟體，理應能輕易在瀏覽器（網頁版）上流暢運行，且純 P2P 網路就能解決所有的傳輸需求。
* **事實：**
1. **瀏覽器儲存的脆弱性：** 現代瀏覽器（如 Chrome, Safari）會在設備空間不足時，靜默且強制地清空 IndexedDB。在沒有中央伺服器備份的架構下，網頁版會導致使用者面臨不可挽回的資料遺失。唯有編譯為二進位執行檔（Tauri/React Native）才能取得作業系統的持久化儲存權限。
2. **P2P 的物理限制：** 純 WebRTC P2P 絕對無法處理「離線留言」，且在對稱式 NAT 環境下有 10%~15% 的連線失敗率。必須引入 Cloudflare 作為 Nostr 中繼站來處理非同步狀態，這是維持通訊可靠性的工程事實。



---

### 資料來源與推論過程

1. **RFC 8305: Happy Eyeballs Version 2**
* **來源網址：** [https://datatracker.ietf.org/doc/html/rfc8305](https://datatracker.ietf.org/doc/html/rfc8305)
* **推論過程：** IETF 制定的雙軌連線競速標準，客觀支撐了我們在「QR Code 設備同步」時，同時發起 LAN（內網直連）與 WAN（WebRTC）請求並中斷較慢者的設計，確保了在複雜網路環境下的最高同步成功率。


2. **Nostr 官方 GitHub：NIP-40 (Expiration) 與 NIP-01 (Ephemeral)**
* **來源網址：** [https://github.com/nostr-protocol/nips/blob/master/40.md](https://github.com/nostr-protocol/nips/blob/master/40.md) , [https://github.com/nostr-protocol/nips/blob/master/01.md](https://github.com/nostr-protocol/nips/blob/master/01.md)
* **推論過程：** 協議明確賦予了事件自動銷毀與「純廣播不儲存」的屬性。這證實了利用 Cloudflare D1 作為中繼站，能在不突破免費層級限制的前提下，完美處理離線留言與線上狀態廣播的技術可行性。


3. **W3C Storage API 規範**
* **來源網址：** [https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria](https://www.google.com/search?q=https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FStorage_API%2FStorage_quotas_and_eviction_criteria)
* **推論過程：** 規範指出瀏覽器具備主動驅逐（Eviction）本地資料的權限。這提供了我們「徹底捨棄網頁版開發」這項決策背後的絕對事實依據。



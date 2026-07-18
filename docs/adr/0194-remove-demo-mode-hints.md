# 0194. 移除登入的「示範模式」提示文字（未填 relay ＝自動選座預設錨點）

- 狀態：已接受
- 日期：2026-07-18
- 相關文件：ADR-0069（登入自動選座 I4）、ADR-0086（行動端真實 relay）、ADR-0188/0189（信任根/錨點）

## 背景與問題

啟動登入畫面仍出現「示範模式」相關文字：
- relay 輸入框標籤 `signIn_relayUrl`＝「中繼站網址（留空使用示範模式）」。
- 收合狀態 fallback `signIn_relayDemo`＝「示範模式（不連真實網路）」，且**首個 render 時 `probing` 尚未 seed，會閃一下該文字**。
- 設定頁 `settings_relayDemo`／`mobileSettings_relayDemo` 同類文字。

但自 ADR-0069 起、且 `ANCHOR_RELAYS` 已填入真實錨點（ADR-0189：cinderous1／jt0856）後，**首次登入未填 relay 時會自動選座填入預設錨點**——「留空＝示範模式」的敘述已誤導。經確認：未動 relay 欄＝用預設錨點；示範（記憶體）後端只在「刻意展開並清空」或「完全無錨點」時才會發生。

## 決策

1. **中性化 i18n 文字**（移除「示範模式」措辭，不移除後端 demo 能力）：
   - `signIn_relayUrl`：「中繼站網址（留空使用示範模式）」→「中繼站網址」（en 同步去掉 hint）。
   - `signIn_relayDemo`／`mobileSettings_relayDemo`：→「尚未連線中繼站」／"Not connected to a relay"。
   - `settings_relayDemo`：→「未設定中繼站」／"No relay set"。
2. **修啟動閃爍**：`SignIn` 的 `probing` 初值改為 `() => !relay && ANCHOR_RELAYS.length > 0`——有錨點且無預設 relay 時起始即 true，首個 render 顯示「正在挑選中繼站…」而非空/示範文字。
3. **行為不變**：demo（記憶體）後端保留（刻意清空 relay 的邊界情境仍可進入），只是**不再以「示範模式」字樣宣傳**。

## 理由

- 錨點已就緒＝一般使用者永遠走真實 relay；「示範模式」字樣只會讓人誤以為沒真的連線。中性文字更誠實（真的沒選 relay 時才顯示，且不宣稱「示範」）。
- seed `probing` 消除首個 render 的誤導閃爍，零行為代價。

## 後果

- 正面：登入/設定不再出現「示範模式／留空使用示範模式」；未填 relay 的行為（自動選座預設錨點）與文字一致。
- 負面 / 已知殘餘風險：demo 後端仍存在但無標籤——刻意清空 relay 者不會看到「示範」字樣（顯示「尚未連線中繼站」，語意仍正確）。
- 測試：`SignIn.test.tsx` 的「顯示示範模式」改為斷言「正在挑選中繼站」＋不含「示範模式」。desktop 406、i18n 綠。

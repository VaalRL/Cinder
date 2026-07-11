// 行動端登入 B（ADR-0081）：配對匯入。沿用桌面 D4a 配對克隆（ADR-0072）——
// 舊機顯示配對碼，新機貼上、比對 SAS 短碼，收到全量捆包後由 snapshot.identity 得到同帳號。
//
// 純 UI（RN 元件）：載荷驗證/身分萃取在 ../auth（重用 @cinder/core `parsePairing`、@cinder/engine
// `PairBundle`）；色彩吃 @cinder/theme。配對「傳輸」（WebRTC＋relay 會合）由呼叫端注入 `onPair`
// ——產線走 engine `runPairTarget`＋`webRtcPairTransport`（需原生/EAS，見 ADR-0063）；測試可注入
// 記憶體傳輸，故本畫面的驅動流程在此環境即可驗。
import { useState } from "react";
import type { PairBundle } from "@cinder/engine";
import { type Locale, type MessageKey, translate } from "@cinder/i18n";
import { resolveTheme, STATUS_COLORS, type Theme, type ThemeTokens } from "@cinder/theme";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native-web";
import { identityFromPairBundle, type MobileIdentity, previewPairing } from "../auth.js";

function makeStyles(tk: ThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: tk.bgB, alignItems: "center", justifyContent: "center", padding: 20 },
    card: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: tk.panel,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: tk.border,
      padding: 20,
      gap: 8,
    },
    title: { fontSize: 20, fontWeight: "700", color: tk.ink },
    label: { fontSize: 12, fontWeight: "600", color: tk.muted, marginTop: 6 },
    input: {
      borderWidth: 1,
      borderColor: tk.border,
      borderRadius: 8,
      backgroundColor: tk.field,
      color: tk.ink,
      paddingVertical: 8,
      paddingHorizontal: 10,
      fontSize: 14,
    },
    relay: { fontSize: 11, color: tk.muted },
    sasWrap: { alignItems: "center", marginTop: 6, gap: 2 },
    sasHint: { fontSize: 12, color: tk.muted, textAlign: "center" },
    sas: { fontSize: 34, fontWeight: "700", color: tk.accent, letterSpacing: 8 },
    waiting: { fontSize: 12, color: tk.muted, textAlign: "center" },
    error: { fontSize: 12, color: STATUS_COLORS.busy },
    button: { backgroundColor: tk.accent, borderRadius: 8, paddingVertical: 10, alignItems: "center", marginTop: 8 },
    buttonText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
    link: { color: tk.accent, fontSize: 13, textAlign: "center", marginTop: 4 },
  });
}

export function PairImportScreen({
  onPair,
  onSignIn,
  onUseNsec,
  locale = "zh-Hant",
  theme = "light",
  accent = null,
  accent2 = null,
}: {
  /** 配對傳輸驅動（注入）：連上舊機→回呼 SAS→回傳全量捆包。產線＝engine runPairTarget＋WebRTC。 */
  onPair: (code: string, onSas: (sas: string) => void) => Promise<PairBundle>;
  /** 登入成功：回傳同帳號身分。 */
  onSignIn: (identity: MobileIdentity) => void;
  /** 切換到 nsec 匯入（A）；未提供＝不顯示入口。 */
  onUseNsec?: () => void;
  locale?: Locale;
  theme?: Theme;
  accent?: string | null;
  accent2?: string | null;
}): JSX.Element {
  const tk = resolveTheme({ theme, accent, accent2 });
  const styles = makeStyles(tk);
  const [code, setCode] = useState("");
  const [sas, setSas] = useState("");
  const [error, setError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);
  const T = (k: MessageKey): string => translate(locale, k);

  const preview = code.trim() ? previewPairing(code) : null;

  const connect = (): void => {
    const pv = previewPairing(code);
    if (!pv.ok) {
      setError(pv.error);
      return;
    }
    setError(null);
    setSas("");
    setBusy(true);
    onPair(code.trim(), setSas)
      .then((bundle) => {
        const r = identityFromPairBundle(bundle);
        if (!r.ok) {
          setError(r.error);
          setBusy(false);
          return;
        }
        onSignIn(r.identity);
      })
      .catch(() => {
        setError("mpair_errCode");
        setBusy(false);
      });
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>{T("mpair_title")}</Text>

        <Text style={styles.label}>{T("mpair_codeLabel")}</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder={T("mpair_codePlaceholder")}
          placeholderTextColor={tk.muted}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
          multiline
          aria-label={T("mpair_codeLabel")}
        />
        {preview && preview.ok && preview.relayHost ? (
          <Text style={styles.relay}>
            {T("mpair_relayVia")}: {preview.relayHost}
          </Text>
        ) : null}

        {sas ? (
          <View style={styles.sasWrap}>
            <Text style={styles.sasHint}>{T("mpair_sasHint")}</Text>
            <Text style={styles.sas}>{sas}</Text>
          </View>
        ) : busy ? (
          <Text style={styles.waiting}>{T("mpair_waiting")}</Text>
        ) : null}
        {error ? <Text style={styles.error}>{T(error)}</Text> : null}

        <Pressable style={styles.button} onPress={connect} disabled={busy} accessibilityRole="button">
          <Text style={styles.buttonText}>{T("mpair_connect")}</Text>
        </Pressable>

        {onUseNsec ? (
          <Pressable onPress={onUseNsec} accessibilityRole="button">
            <Text style={styles.link}>{T("mpair_toNsec")}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

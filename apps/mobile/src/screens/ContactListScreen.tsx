// Phase D 起手：行動端聯絡人清單。以 react-native-web 的 RN 元件撰寫（可在此環境瀏覽器渲染
// 與測試），重用 @cinder/core（npub 編碼）與 @cinder/i18n（多語系）。原生打包/端上 LLM 待
// 有工具鏈時（見 ROADMAP Phase D）。
// 註：目前直接 import "react-native-web"；日後上原生時可加 bundler 別名（react-native→web）
// 讓同一份原始碼跨 web/native。
import { npubEncode } from "@cinder/core";
import { type Locale, type MessageKey, translate } from "@cinder/i18n";
import { StyleSheet, Text, View } from "react-native-web";

export type MobileStatus = "online" | "away" | "busy" | "offline";
export interface MobileContact {
  pubkey: string;
  name: string;
  status: MobileStatus;
}

const STATUS_SECTIONS: MobileStatus[] = ["online", "away", "busy", "offline"];
const STATUS_KEY: Record<MobileStatus, MessageKey> = {
  online: "status_online",
  away: "status_away",
  busy: "status_busy",
  offline: "status_offline",
};
const STATUS_COLOR: Record<MobileStatus, string> = {
  online: "#36c46b",
  away: "#f2b134",
  busy: "#e5484d",
  offline: "#b8c2d0",
};

/** 依上線狀態分區、每區依名稱排序；只回傳非空的區（與桌面版一致）。 */
export function groupByStatus(contacts: MobileContact[]): { status: MobileStatus; contacts: MobileContact[] }[] {
  return STATUS_SECTIONS.map((status) => ({
    status,
    contacts: contacts.filter((c) => c.status === status).sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((sec) => sec.contacts.length > 0);
}

function shortNpub(npub: string): string {
  return npub.length > 18 ? `${npub.slice(0, 12)}…` : npub;
}

export function ContactListScreen({
  selfPubkey,
  selfName,
  contacts,
  locale = "zh-Hant",
}: {
  selfPubkey: string;
  selfName: string;
  contacts: MobileContact[];
  locale?: Locale;
}): JSX.Element {
  return (
    <View style={styles.root}>
      <View style={styles.me}>
        <Text style={styles.meName}>{selfName}</Text>
        <Text style={styles.meNpub}>{shortNpub(npubEncode(selfPubkey))}</Text>
      </View>
      {groupByStatus(contacts).map((sec) => (
        <View key={sec.status}>
          <Text style={styles.section}>
            {translate(locale, STATUS_KEY[sec.status])}（{sec.contacts.length}）
          </Text>
          {sec.contacts.map((c) => (
            <View key={c.pubkey} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: STATUS_COLOR[c.status] }]} />
              <Text style={styles.name}>{c.name}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  me: { padding: 12, backgroundColor: "#eef4ff" },
  meName: { fontWeight: "700", fontSize: 16, color: "#1b2b44" },
  meNpub: { fontSize: 11, color: "#6b7d99" },
  section: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 2, fontSize: 11, fontWeight: "700", color: "#2f6cd6" },
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, paddingHorizontal: 12 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  name: { fontSize: 14, color: "#1b2b44" },
});

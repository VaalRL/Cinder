import { KIND } from "./constants.js";
import type { NostrEvent } from "./event.js";
import type { PubkeyHex, SecretKey } from "./keys.js";
import type { Rumor } from "./nip59.js";
import { sealAndWrap } from "./nip59.js";

const DAY_SECONDS = 86_400;
const DEFAULT_TTL_SECONDS = 7 * DAY_SECONDS;

/**
 * 廣播頭像 data URI 的字元數上限（ADR-0154）。來源端 128px JPEG 縮圖實測 3–8KB，
 * 48KB 給足餘裕；收端超過即丟棄（防惡意巨大頭像塞爆儲存/記憶體）。
 */
export const PROFILE_AVATAR_MAX_BYTES = 48_000;

/**
 * 廣播頭像格式白名單（ADR-0154）：只認 base64 點陣圖 data URI。
 * 排除 SVG——可執行標記（script/外部參照），同 ADR-0102 縮圖政策的排除理由；
 * 也擋掉 http(s)/javascript 等任何非 data 來源（頭像字串會進 CSS `url()`）。
 */
export function validAvatarDataUri(s: string): boolean {
  return s.length <= PROFILE_AVATAR_MAX_BYTES && /^data:image\/(jpeg|png|webp|gif);base64,/.test(s);
}

/** 加密個人檔內容（ADR-0061 名稱；ADR-0154 擴充頭像）。 */
export interface ProfileData {
  name?: string;
  /**
   * 頭像 data URI 縮圖（ADR-0154）：`""`＝已移除（收端清掉既存頭像）；
   * `undefined`／欄位缺席＝無變更（不清不改）。
   */
  avatar?: string;
}

/**
 * 顯示名稱與頭像（個人檔）以**加密 Gift Wrap 廣播給聯絡人**，而非公開 kind 0（ADR-0061／0154）——
 * 只有聯絡人看得到你的暱稱與頭像，中繼站看到的是密文，維持隱私鐵則。rumor 為 kind 0、
 * content 為 `{name, avatar?}`（NIP-01 個人檔子集；avatar 為內嵌 data URI，非 URL——
 * 網址只當輸入方式，絕不把 URL 發給對方讓對方裝置去抓，見 ADR-0154）。
 */
export function wrapProfile(
  profile: { name: string; avatar?: string },
  senderSk: SecretKey,
  recipientPk: PubkeyHex,
  opts: { now?: number; relayHint?: string } = {},
): NostrEvent {
  const nowSec = opts.now ?? Math.floor(Date.now() / 1000);
  // relayHint（ADR-0066）：寫入 rumor 內層（加密、外層不可見），收端以既有 learnRelayHint 學路由。
  const tags = opts.relayHint ? [["relay", opts.relayHint]] : [];
  const content: ProfileData = { name: profile.name };
  if (profile.avatar !== undefined) content.avatar = profile.avatar;
  return sealAndWrap(
    { kind: KIND.PROFILE, created_at: nowSec, tags, content: JSON.stringify(content) },
    senderSk,
    recipientPk,
    {
      kind: KIND.OFFLINE_DM_GIFT_WRAP,
      tags: [
        ["p", recipientPk],
        ["expiration", String(nowSec + DEFAULT_TTL_SECONDS)],
      ],
    },
  );
}

/**
 * 從個人檔 rumor 取出顯示名稱與頭像（kind 0，content JSON）。非個人檔、壞 JSON、
 * 或名稱與頭像皆無效時回 undefined。頭像收端防禦（ADR-0154）：僅接受白名單 data URI
 * 且未超長者；`""` 原樣保留（移除記號）；無效值視同缺席（丟棄，不清除既存頭像）。
 */
export function parseProfile(rumor: Rumor): ProfileData | undefined {
  if (rumor.kind !== KIND.PROFILE) return undefined;
  try {
    const raw = JSON.parse(rumor.content) as { name?: unknown; avatar?: unknown };
    const out: ProfileData = {};
    if (typeof raw.name === "string" && raw.name.trim()) out.name = raw.name.trim();
    if (typeof raw.avatar === "string" && (raw.avatar === "" || validAvatarDataUri(raw.avatar))) out.avatar = raw.avatar;
    return out.name !== undefined || out.avatar !== undefined ? out : undefined;
  } catch {
    return undefined;
  }
}

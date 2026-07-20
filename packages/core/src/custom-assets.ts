// 統一自訂資產（emoji＋貼圖）的行內清單與短碼解析（ADR-0220）。
//
// 自訂 emoji 走既有加密訊息通道——與自製貼圖（ADR-0032 `nb-sticker:v2:`）同源，
// 差別只在「用法」：貼圖是整則大圖，emoji 是行內小圖，打 `:shortcode:` 插入。
// 去中心化沒有中央目錄，故訊息文字尾端附一段「本則引用資產清單」`nb-assets:v1:`，
// 收端解析後行內渲染並可自動收藏；解析序＝本則清單 → 本機庫 → 保留原字（優雅退化）。
// 全純函式，可於 node 環境完整測試。

import { contentHash } from "./event.js";
import { clampStickerLabel, validateStickerSvg } from "./sticker-svg.js";

/** 行內資產清單前綴（附於訊息文字尾端，只帶本則引用的資產）。 */
export const ASSET_MANIFEST_PREFIX = "nb-assets:v1:";

/** 清單總位元組上限（ADR-0220）：落在 NIP-44 明文上限（65535）內，且限制群組扇出放大。 */
export const ASSET_MANIFEST_MAX_BYTES = 48 * 1024;

/** 單則訊息內嵌資產數量上限（防一則塞爆扇出）。 */
export const ASSET_MANIFEST_MAX_COUNT = 24;

/** 自訂資產種類（ADR-0220）。 */
export type CustomAssetKind = "sticker" | "emoji" | "both";

/**
 * 自訂資產（本機庫模型）：`id` 為 SVG 內容雜湊（`contentHash`）作去重；
 * emoji 用途需有 `shortcode`（打 `:shortcode:` 插入）。
 */
export interface CustomAsset {
  id: string;
  label: string;
  svg: string;
  kind: CustomAssetKind;
  shortcode?: string;
}

/** 行內清單負載（隨訊息）：shortcode → { 標籤, SVG }。 */
export type AssetManifest = Record<string, { label: string; svg: string }>;

/**
 * 短碼合法字元（Slack 風格）：字母數字開頭，後續可含 `_ + -`，總長 ≤32。
 * 刻意不收 Unicode，避免與一般中文文字的冒號用法混淆。
 */
const SHORTCODE_RE = /^[a-z0-9][a-z0-9_+-]{0,31}$/i;

/** 文字中的短碼 token（全域）：使用前務必重置 `lastIndex`。 */
const SHORTCODE_TOKEN = /:([a-z0-9][a-z0-9_+-]{0,31}):/gi;

/** 是否為合法短碼（不含前後冒號）。 */
export function isValidShortcode(code: string): boolean {
  return SHORTCODE_RE.test(code);
}

/** 組出行內資產清單字串（附於文字尾端）。 */
export function formatAssetManifest(manifest: AssetManifest): string {
  return ASSET_MANIFEST_PREFIX + JSON.stringify(manifest);
}

/**
 * 解析行內資產清單；逐筆防禦性驗證（短碼合法、SVG 過 `validateStickerSvg`、
 * 夾住標籤、限數量）；非法整筆丟棄，非法 JSON 回傳空清單。不信任對端手工訊息。
 */
export function parseAssetManifest(s: string): AssetManifest {
  if (!s.startsWith(ASSET_MANIFEST_PREFIX)) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(s.slice(ASSET_MANIFEST_PREFIX.length));
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const out: AssetManifest = {};
  let count = 0;
  for (const [key, val] of Object.entries(parsed as Record<string, unknown>)) {
    if (count >= ASSET_MANIFEST_MAX_COUNT) break;
    if (!isValidShortcode(key)) continue;
    if (!val || typeof val !== "object") continue;
    const label = (val as { label?: unknown }).label;
    const svg = (val as { svg?: unknown }).svg;
    if (typeof label !== "string" || typeof svg !== "string") continue;
    if (!validateStickerSvg(svg).ok) continue;
    out[key] = { label: clampStickerLabel(label), svg };
    count++;
  }
  return out;
}

/** 把資產清單接到文字尾端；空清單則原樣返回（不留痕跡）。 */
export function appendAssetManifest(text: string, manifest: AssetManifest): string {
  if (Object.keys(manifest).length === 0) return text;
  return `${text}\n${formatAssetManifest(manifest)}`;
}

/**
 * 從訊息內容拆出「可見文字」與「資產清單」。清單附於最後一行、以 `nb-assets:v1:`
 * 起頭；解析不出有效清單則整段視為文字（向後相容：舊版 client 直接顯示尾端字面）。
 */
export function splitAssetManifest(content: string): { text: string; manifest: AssetManifest } {
  const marker = `\n${ASSET_MANIFEST_PREFIX}`;
  const at = content.lastIndexOf(marker);
  if (at === -1) return { text: content, manifest: {} };
  const manifest = parseAssetManifest(content.slice(at + 1)); // 跳過換行
  if (Object.keys(manifest).length === 0) return { text: content, manifest: {} };
  return { text: content.slice(0, at), manifest };
}

/** 訊息可見文字內引用到的短碼（依出現序、去重）。供送出端據以組清單。 */
export function collectReferencedShortcodes(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  SHORTCODE_TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SHORTCODE_TOKEN.exec(text)) !== null) {
    const code = m[1];
    if (code === undefined) continue;
    if (!seen.has(code)) {
      seen.add(code);
      out.push(code);
    }
  }
  return out;
}

/** 行內解析後的片段：純文字或一顆 emoji。 */
export type InlineSegment =
  | { type: "text"; value: string }
  | { type: "emoji"; shortcode: string; label: string; svg: string };

/**
 * 把含 `:shortcode:` 的文字切成片段序列。`resolve` 由呼叫端提供（通常＝本則清單優先、
 * 其次本機庫）；解析不到的短碼保留為字面文字。相鄰文字自動合併。
 */
export function resolveInlineEmoji(
  text: string,
  resolve: (shortcode: string) => { label: string; svg: string } | undefined,
): InlineSegment[] {
  const segs: InlineSegment[] = [];
  const pushText = (value: string): void => {
    if (!value) return;
    const prev = segs[segs.length - 1];
    if (prev && prev.type === "text") prev.value += value;
    else segs.push({ type: "text", value });
  };
  SHORTCODE_TOKEN.lastIndex = 0;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = SHORTCODE_TOKEN.exec(text)) !== null) {
    const code = m[1];
    if (code === undefined) continue;
    const asset = resolve(code);
    if (!asset) continue; // 未解析：併入後續文字（不移動 last）
    pushText(text.slice(last, m.index));
    segs.push({ type: "emoji", shortcode: code, label: asset.label, svg: asset.svg });
    last = m.index + m[0].length;
  }
  pushText(text.slice(last));
  return segs;
}

/** 由清單一筆造出 emoji 用途的 `CustomAsset`（id＝內容雜湊，供去重）。 */
export function assetFromManifestEntry(
  shortcode: string,
  entry: { label: string; svg: string },
): CustomAsset {
  return {
    id: contentHash(entry.svg),
    label: clampStickerLabel(entry.label),
    svg: entry.svg,
    kind: "emoji",
    shortcode,
  };
}

/** 資產清單序列化後的位元組數（供送出端檢查每則預算）。 */
export function assetManifestBytes(manifest: AssetManifest): number {
  return new TextEncoder().encode(formatAssetManifest(manifest)).length;
}

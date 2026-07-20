import { describe, expect, it } from "vitest";
import { contentHash } from "./event.js";
import {
  ASSET_MANIFEST_MAX_COUNT,
  ASSET_MANIFEST_PREFIX,
  appendAssetManifest,
  assetFromManifestEntry,
  assetManifestBytes,
  collectReferencedShortcodes,
  formatAssetManifest,
  isValidShortcode,
  parseAssetManifest,
  resolveInlineEmoji,
  splitAssetManifest,
  type AssetManifest,
} from "./custom-assets.js";

const smiley =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#ffd84d"/></svg>';
const heart =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 82 C10 54 22 22 50 40 C78 22 90 54 50 82 Z" fill="#e8567a"/></svg>';

describe("短碼合法性（ADR-0220）", () => {
  it("接受 Slack 風格短碼", () => {
    for (const c of ["party", "party_blob", "a", "x1", "up-vote", "c+"]) {
      expect(isValidShortcode(c), c).toBe(true);
    }
  });
  it("拒收空白/含冒號/空格/開頭符號/超長/中文", () => {
    for (const c of ["", ":party:", "has space", "_lead", "-lead", "a".repeat(33), "派對"]) {
      expect(isValidShortcode(c), c).toBe(false);
    }
  });
});

describe("資產清單 format / parse（nb-assets:v1）", () => {
  it("round-trip 保留合法筆、夾住標籤", () => {
    const manifest: AssetManifest = {
      party: { label: "  派對  ", svg: smiley },
      love: { label: "愛心", svg: heart },
    };
    const s = formatAssetManifest(manifest);
    expect(s.startsWith(ASSET_MANIFEST_PREFIX)).toBe(true);
    expect(parseAssetManifest(s)).toEqual({
      party: { label: "派對", svg: smiley },
      love: { label: "愛心", svg: heart },
    });
  });

  it("丟棄非法 SVG 與非法短碼鍵，保留合法筆", () => {
    const raw =
      ASSET_MANIFEST_PREFIX +
      JSON.stringify({
        ok: { label: "好", svg: smiley },
        evil: { label: "壞", svg: '<svg onload="x()"></svg>' },
        "bad key": { label: "鍵不合法", svg: heart },
        missing: { label: "缺 svg" },
      });
    expect(parseAssetManifest(raw)).toEqual({ ok: { label: "好", svg: smiley } });
  });

  it("非法 JSON / 非物件回傳空清單", () => {
    expect(parseAssetManifest(ASSET_MANIFEST_PREFIX + "{壞")).toEqual({});
    expect(parseAssetManifest(ASSET_MANIFEST_PREFIX + "[1,2]")).toEqual({});
    expect(parseAssetManifest("不是清單")).toEqual({});
  });

  it("超過數量上限只保留前 N 筆", () => {
    const big: Record<string, { label: string; svg: string }> = {};
    for (let i = 0; i < ASSET_MANIFEST_MAX_COUNT + 5; i++) big[`e${i}`] = { label: `${i}`, svg: smiley };
    const parsed = parseAssetManifest(ASSET_MANIFEST_PREFIX + JSON.stringify(big));
    expect(Object.keys(parsed).length).toBe(ASSET_MANIFEST_MAX_COUNT);
  });
});

describe("文字 append / split 清單", () => {
  it("append 後可 split 還原（文字＋清單）", () => {
    const manifest: AssetManifest = { party: { label: "派對", svg: smiley } };
    const text = "嗨 :party: 你好";
    const content = appendAssetManifest(text, manifest);
    expect(content).toContain(`\n${ASSET_MANIFEST_PREFIX}`);
    expect(splitAssetManifest(content)).toEqual({ text, manifest });
  });

  it("空清單不留痕跡", () => {
    expect(appendAssetManifest("純文字", {})).toBe("純文字");
    expect(splitAssetManifest("純文字")).toEqual({ text: "純文字", manifest: {} });
  });

  it("尾端像清單但無效者整段視為文字", () => {
    const content = "看這個 nb-assets:v1:壞掉";
    expect(splitAssetManifest(content)).toEqual({ text: content, manifest: {} });
  });
});

describe("行內 :shortcode: 解析為片段", () => {
  const resolve = (code: string) =>
    code === "party" ? { label: "派對", svg: smiley } : code === "love" ? { label: "愛心", svg: heart } : undefined;

  it("解析命中者為 emoji、相鄰文字合併、未命中留字面", () => {
    expect(resolveInlineEmoji("嗨 :party: 這個 :nope: 好", resolve)).toEqual([
      { type: "text", value: "嗨 " },
      { type: "emoji", shortcode: "party", label: "派對", svg: smiley },
      { type: "text", value: " 這個 :nope: 好" },
    ]);
  });

  it("相連兩顆 emoji 之間無空文字", () => {
    expect(resolveInlineEmoji(":party::love:", resolve)).toEqual([
      { type: "emoji", shortcode: "party", label: "派對", svg: smiley },
      { type: "emoji", shortcode: "love", label: "愛心", svg: heart },
    ]);
  });

  it("純文字（無短碼）單一片段", () => {
    expect(resolveInlineEmoji("完全沒有短碼", resolve)).toEqual([{ type: "text", value: "完全沒有短碼" }]);
  });

  it("收集引用短碼：依序、去重", () => {
    expect(collectReferencedShortcodes("a :party: b :love: c :party:")).toEqual(["party", "love"]);
  });
});

describe("由清單造 CustomAsset 與位元組計量", () => {
  it("assetFromManifestEntry：id＝內容雜湊、kind emoji、帶短碼、夾標籤", () => {
    const asset = assetFromManifestEntry("party", { label: "  派對 ", svg: smiley });
    expect(asset).toEqual({ id: contentHash(smiley), label: "派對", svg: smiley, kind: "emoji", shortcode: "party" });
  });

  it("assetManifestBytes 反映序列化長度", () => {
    const manifest: AssetManifest = { party: { label: "派對", svg: smiley } };
    expect(assetManifestBytes(manifest)).toBe(new TextEncoder().encode(formatAssetManifest(manifest)).length);
  });
});

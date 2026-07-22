// 威脅情報 snapshot 拉取與快取（ADR-0231 P2）＋設定與自訂清單（P3）。
import { matchThreat, type ThreatDb } from "@cinderous/core";
import { setKvBackend, type KvStore } from "@cinderous/engine";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  composeThreatDb,
  lastThreatFetch,
  loadCachedThreatDb,
  loadCustomDomains,
  normalizeCustomDomains,
  refreshThreatDb,
  saveCustomDomains,
  setThreatIntelEnabled,
  setThreatSendWarnEnabled,
  setThreatStrictEnabled,
  threatIntelEnabled,
  threatSendWarnEnabled,
  threatStrictEnabled,
} from "./threat-db.js";

const SNAPSHOT = {
  updated: "2026-07-22",
  sources: [{ id: "urlhaus", name: "URLhaus", url: "https://urlhaus.abuse.ch" }],
  domains: { urlhaus: ["evil.com"] },
};

const mem = new Map<string, string>();
const memKv: KvStore = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => void mem.set(k, v),
  removeItem: (k) => void mem.delete(k),
};

beforeEach(() => setKvBackend(memKv));
afterEach(() => {
  setKvBackend(null);
  mem.clear();
});

describe("threatIntelEnabled（opt-in）", () => {
  it("預設開；關閉／重開往返", () => {
    expect(threatIntelEnabled()).toBe(true);
    setThreatIntelEnabled(false);
    expect(threatIntelEnabled()).toBe(false);
    setThreatIntelEnabled(true);
    expect(threatIntelEnabled()).toBe(true);
  });
});

describe("refreshThreatDb／loadCachedThreatDb", () => {
  const okFetch = (body: unknown): typeof fetch =>
    (() => Promise.resolve({ ok: true, json: () => Promise.resolve(body) })) as unknown as typeof fetch;

  it("成功 → 回 ThreatDb＋寫快取＋記時間；快取可還原", async () => {
    const db = await refreshThreatDb(okFetch(SNAPSHOT), "https://x/threat-intel.json", 1234);
    expect(db).not.toBeNull();
    expect(db!.domains.get("urlhaus")!.has("evil.com")).toBe(true);
    expect(lastThreatFetch()).toBe(1234);
    const cached = loadCachedThreatDb();
    expect(cached!.sources[0]!.name).toBe("URLhaus");
  });

  it("HTTP 失敗／壞 JSON／壞形狀 → 靜默 null、不動快取", async () => {
    const notOk = (() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) })) as unknown as typeof fetch;
    const throws = (() => Promise.reject(new Error("offline"))) as unknown as typeof fetch;
    await expect(refreshThreatDb(notOk, "https://x", 1)).resolves.toBeNull();
    await expect(refreshThreatDb(throws, "https://x", 1)).resolves.toBeNull();
    await expect(refreshThreatDb(okFetch({ sources: [], domains: {} }), "https://x", 1)).resolves.toBeNull();
    expect(loadCachedThreatDb()).toBeNull();
    expect(lastThreatFetch()).toBeNull();
  });

  it("無快取／快取壞資料 → null", () => {
    expect(loadCachedThreatDb()).toBeNull();
    memKv.setItem("nb.threatIntel.snapshot", "not-json");
    expect(loadCachedThreatDb()).toBeNull();
  });
});

describe("P3 設定：送出警示／嚴格模式（預設值與往返）", () => {
  it("送出警示預設開；嚴格預設關", () => {
    expect(threatSendWarnEnabled()).toBe(true);
    expect(threatStrictEnabled()).toBe(false);
    setThreatSendWarnEnabled(false);
    setThreatStrictEnabled(true);
    expect(threatSendWarnEnabled()).toBe(false);
    expect(threatStrictEnabled()).toBe(true);
  });
});

describe("自訂封鎖清單與合成（ADR-0231 P3）", () => {
  it("normalizeCustomDomains：小寫、去 www.、丟非法、去重", () => {
    expect(normalizeCustomDomains("WWW.Evil.com\n\nbad.example\nevil.com\nnot a domain\nsingleword")).toEqual([
      "evil.com",
      "bad.example",
    ]);
  });

  it("save/load round-trip；壞資料回 []", () => {
    saveCustomDomains(["evil.com"]);
    expect(loadCustomDomains()).toEqual(["evil.com"]);
    memKv.setItem("nb.threatIntel.custom", "not-json");
    expect(loadCustomDomains()).toEqual([]);
  });

  it("composeThreatDb：自訂排最前、命中 id=custom；兩者皆空回 null", () => {
    expect(composeThreatDb(null, [])).toBeNull();
    const base: ThreatDb = {
      sources: [{ id: "urlhaus", name: "URLhaus" }],
      domains: new Map([["urlhaus", new Set(["bad.example"])]]),
    };
    expect(composeThreatDb(base, [])).toBe(base);
    const merged = composeThreatDb(base, ["evil.com"])!;
    expect(merged.sources.map((s) => s.id)).toEqual(["custom", "urlhaus"]);
    expect(matchThreat(merged, "a.evil.com").map((s) => s.id)).toEqual(["custom"]);
    expect(matchThreat(merged, "bad.example").map((s) => s.id)).toEqual(["urlhaus"]);
    const customOnly = composeThreatDb(null, ["evil.com"])!;
    expect(matchThreat(customOnly, "evil.com").map((s) => s.id)).toEqual(["custom"]);
  });
});

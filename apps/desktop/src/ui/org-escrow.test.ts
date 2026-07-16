import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type EscrowEntry, loadEscrow, offboardedEntries, removeEscrow, saveEscrow, upsertEscrow } from "./org-escrow.js";

const entry = (pubkey: string, name = "小美"): EscrowEntry => ({
  pubkey,
  name,
  nsec: "nsec1abc",
  relayUrl: "wss://corp.example",
  at: 1000,
});

describe("入職金鑰託管（ADR-0163）", () => {
  it("upsert 以 pubkey 為鍵；remove 移除", () => {
    let list = upsertEscrow([], entry("a"));
    list = upsertEscrow(list, entry("a", "改名")); // 同 pubkey → 取代
    expect(list.length).toBe(1);
    expect(list[0]!.name).toBe("改名");
    list = upsertEscrow(list, entry("b"));
    expect(list.length).toBe(2);
    expect(removeEscrow(list, "a").map((e) => e.pubkey)).toEqual(["b"]);
  });

  it("offboardedEntries：託管中但不在現行名冊在世成員＝已離職", () => {
    const list = [entry("a"), entry("b"), entry("c")];
    const live = new Set(["a", "c"]); // b 已被移出名冊
    expect(offboardedEntries(list, live).map((e) => e.pubkey)).toEqual(["b"]);
    expect(offboardedEntries(list, new Set(["a", "b", "c"]))).toEqual([]); // 全在職
  });

  describe("持久化（依管理者身分）", () => {
    beforeEach(() => {
      const store = new Map<string, string>();
      (globalThis as { localStorage?: unknown }).localStorage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      };
    });
    afterEach(() => {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    });

    it("round-trip；毀損回空；過濾非法形狀", () => {
      saveEscrow("admin1", [entry("a")]);
      expect(loadEscrow("admin1").map((e) => e.pubkey)).toEqual(["a"]);
      expect(loadEscrow("other")).toEqual([]); // 依身分隔離
      localStorage.setItem("nb.orgEscrow.bad", "not json");
      expect(loadEscrow("bad")).toEqual([]);
    });
  });
});

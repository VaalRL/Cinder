import { describe, expect, it } from "vitest";
import { MemoryStorage } from "./memory.js";
import { isThumbnailable, THUMB_MAX_BYTES } from "./types.js";
import { exportRecords } from "./export.js";

/** 建一份含文字、檔案、群訊、回應、已收回的儲存作為測試素材。 */
function seed(): MemoryStorage {
  const s = new MemoryStorage();
  s.addContact({ pubkey: "bob", name: "Bob" });
  s.saveGroup({ id: "g1", name: "好友", admin: "me", members: ["me", "bob"] });
  s.appendMessage({ id: "m1", contact: "bob", outgoing: true, text: "晚點打給你", at: 1_700_000_000_000 });
  s.appendMessage({ id: "m2", contact: "bob", outgoing: false, text: "好", at: 1_700_000_060_000 });
  s.appendMessage({
    id: "m3",
    contact: "bob",
    outgoing: false,
    text: "",
    at: 1_700_000_120_000,
    file: { tid: "f1", name: "report.pdf", size: 20480, mime: "application/pdf", savedPath: "D:/下載/report.pdf" },
  });
  s.appendMessage({ id: "gm1", contact: "g1", outgoing: false, text: "嗨大家", at: 1_700_000_200_000, sender: "bob" });
  s.addReaction({ id: "r1", messageId: "m2", emoji: "👍", mine: true });
  s.markDeleted("m1");
  return s;
}

describe("明文紀錄導出（ADR-0094）", () => {
  it("TXT：含對話標頭、時間、對象、文字；檔案顯示為 metadata 行含儲存路徑", () => {
    const txt = exportRecords(seed(), "txt", { now: 1_700_000_300_000 });
    expect(txt).toContain("對話：Bob");
    expect(txt).toContain("Bob：好");
    expect(txt).toContain("📄 report.pdf");
    expect(txt).toContain("D:/下載/report.pdf");
    expect(txt).toContain("群組：好友");
  });

  it("已收回訊息標「（已收回）」、不外洩原文", () => {
    const txt = exportRecords(seed(), "txt", {});
    expect(txt).toContain("（已收回）");
    expect(txt).not.toContain("晚點打給你");
  });

  it("emoji 回應附在對應訊息後；可關閉", () => {
    expect(exportRecords(seed(), "txt", {})).toContain("👍");
    expect(exportRecords(seed(), "txt", { includeReactions: false })).not.toContain("👍");
  });

  it("Markdown：標題與清單格式", () => {
    const md = exportRecords(seed(), "md", {});
    expect(md).toContain("# Cinder 對話紀錄導出");
    expect(md).toContain("## 對話：Bob");
    expect(md).toMatch(/- \*\*\[.+\] Bob：\*\* 好/);
  });

  it("JSON：結構化、含 file metadata 與回應、時間為原始毫秒", () => {
    const json = JSON.parse(exportRecords(seed(), "json", { now: 42 }));
    expect(json.app).toBe("Cinder");
    expect(json.exportedAt).toBe(42);
    const bob = json.conversations.find((c: { name: string }) => c.name === "Bob");
    expect(bob.kind).toBe("contact");
    const fileMsg = bob.messages.find((m: { id: string }) => m.id === "m3");
    expect(fileMsg.file).toMatchObject({ name: "report.pdf", size: 20480, savedPath: "D:/下載/report.pdf" });
    const reacted = bob.messages.find((m: { id: string }) => m.id === "m2");
    expect(reacted.reactions).toEqual(["👍"]);
    expect(bob.messages.find((m: { id: string }) => m.id === "m1").deleted).toBe(true);
  });

  it("範圍可選：只導出指定對話鍵", () => {
    const onlyGroup = exportRecords(seed(), "txt", { keys: ["g1"] });
    expect(onlyGroup).toContain("群組：好友");
    expect(onlyGroup).not.toContain("對話：Bob");
  });

  it("群訊以 sender 名標示對象", () => {
    expect(exportRecords(seed(), "txt", { keys: ["g1"] })).toContain("Bob：嗨大家");
  });

  it("不含私鑰／檔案本體（只有 metadata）", () => {
    const s = seed();
    s.saveIdentity({ nsec: "nsec1SECRET", name: "me" });
    const all = exportRecords(s, "json", {});
    expect(all).not.toContain("nsec1SECRET");
  });
});

describe("圖片縮圖持久化（ADR-0102）", () => {
  const img = (thumb?: string) => ({
    id: "p1",
    contact: "bob",
    outgoing: false,
    text: "",
    at: 1,
    file: { tid: "t1", name: "a.png", size: 900, mime: "image/png", ...(thumb ? { thumb } : {}) },
  });

  it("縮圖跨 session 存活（重載後仍在）——這正是相簿空掉的根因修正", () => {
    const s = new MemoryStorage();
    s.addContact({ pubkey: "bob", name: "Bob" });
    s.appendMessage(img());
    s.setFileThumb("bob", "p1", "data:image/jpeg;base64,AAAA");
    // 模擬重載：快照 export/import（等同 Tauri 加密 blob 的來回）
    const restored = new MemoryStorage();
    restored.importSnapshot(s.exportSnapshot());
    expect(restored.loadMessages("bob")[0]?.file?.thumb).toBe("data:image/jpeg;base64,AAAA");
  });

  it("超過上限的縮圖不存（寧可沒縮圖，也不讓儲存膨脹）", () => {
    const s = new MemoryStorage();
    s.appendMessage(img());
    s.setFileThumb("bob", "p1", "x".repeat(THUMB_MAX_BYTES + 1));
    expect(s.loadMessages("bob")[0]?.file?.thumb).toBeUndefined();
  });

  it("原檔位元組**依然不保存**（ADR-0093 裁示不變）：只有 metadata 與縮圖", () => {
    const s = new MemoryStorage();
    s.appendMessage(img("data:image/jpeg;base64,AAAA"));
    const f = s.loadMessages("bob")[0]?.file;
    expect(Object.keys(f ?? {}).sort()).toEqual(["mime", "name", "size", "thumb", "tid"]);
  });

  it("isThumbnailable：只認點陣圖；SVG 排除（可執行標記，不必要的攻擊面）", () => {
    expect(isThumbnailable("image/png")).toBe(true);
    expect(isThumbnailable("image/jpeg")).toBe(true);
    expect(isThumbnailable("image/svg+xml")).toBe(false);
    expect(isThumbnailable("application/pdf")).toBe(false);
  });
});

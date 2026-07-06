import { describe, expect, it } from "vitest";
import { isMentioned, mentionedPubkeys, mentionTags, parseMentions } from "./mention.js";
import type { Rumor } from "./nip59.js";

const rumor = (tags: string[][]): Rumor => ({
  id: "x",
  pubkey: "sender",
  created_at: 0,
  kind: 14,
  tags,
  content: "hi",
});

describe("parseMentions（ADR-0050）", () => {
  const cands = [
    { pubkey: "pk_alice", name: "Alice" },
    { pubkey: "pk_bob", name: "Bob" },
    { pubkey: "pk_wang", name: "王小明" },
  ];

  it("命中詞界結尾的提及、去重、拉丁大小寫不敏感", () => {
    expect(parseMentions("@Alice 你好", cands)).toEqual(["pk_alice"]);
    expect(parseMentions("嗨 @alice！", cands)).toEqual(["pk_alice"]); // 標點結尾 + 小寫
    expect(parseMentions("@Alice @Bob @Alice", cands).sort()).toEqual(["pk_alice", "pk_bob"]); // 去重
  });

  it("CJK 名稱可提及", () => {
    expect(parseMentions("@王小明 過來", cands)).toEqual(["pk_wang"]);
  });

  it("非詞界/內嵌 @ 不誤配（避免 email 與 substring）", () => {
    expect(parseMentions("寄到 a@Bob.com", cands)).toEqual([]); // @ 前非詞界
    expect(parseMentions("@Alicexyz", cands)).toEqual([]); // 結尾非詞界
  });

  it("最長名稱優先，避免短名稱遮蔽", () => {
    const both = [
      { pubkey: "pk_al", name: "Al" },
      { pubkey: "pk_alice", name: "Alice" },
    ];
    expect(parseMentions("@Alice", both)).toEqual(["pk_alice"]);
  });

  it("空名稱候選被略過", () => {
    expect(parseMentions("@Alice", [{ pubkey: "pk_x", name: "" }, ...cands])).toEqual(["pk_alice"]);
  });
});

describe("mentionTags / mentionedPubkeys / isMentioned", () => {
  it("公鑰轉 p-tag 並去重", () => {
    expect(mentionTags(["pk1", "pk1", "pk2"])).toEqual([
      ["p", "pk1"],
      ["p", "pk2"],
    ]);
  });

  it("讀出 rumor 內層被提及公鑰、判定是否提及我", () => {
    const r = rumor([
      ["g", "grp"],
      ["p", "pk1"],
      ["p", "pk2"],
    ]);
    expect(mentionedPubkeys(r)).toEqual(["pk1", "pk2"]);
    expect(isMentioned(r, "pk2")).toBe(true);
    expect(isMentioned(r, "pk_none")).toBe(false);
  });
});

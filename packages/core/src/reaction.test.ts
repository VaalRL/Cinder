import { describe, expect, it } from "vitest";
import { KIND } from "./constants.js";
import { generateSecretKey, getPublicKey } from "./keys.js";
import { openWrap } from "./nip59.js";
import { reactionTarget, wrapReaction } from "./reaction.js";

const aliceSk = generateSecretKey();
const alicePk = getPublicKey(aliceSk);
const bobSk = generateSecretKey();
const bobPk = getPublicKey(bobSk);

describe("訊息回應（NIP-25，Gift Wrap 包封）", () => {
  it("收件人可還原回應：kind 7、指向目標、emoji 與寄件人", () => {
    const wrap = wrapReaction("👍", aliceSk, bobPk, "target-event-id");
    expect(wrap.kind).toBe(KIND.OFFLINE_DM_GIFT_WRAP);
    const { sender, rumor } = openWrap(wrap, bobSk);
    expect(sender).toBe(alicePk);
    expect(rumor.kind).toBe(KIND.REACTION);
    expect(rumor.content).toBe("👍");
    expect(reactionTarget(rumor)).toBe("target-event-id");
  });

  it("外層作者非寄件人（隱藏誰回應誰）、第三者無法解", () => {
    const wrap = wrapReaction("❤️", aliceSk, bobPk, "t1");
    expect(wrap.pubkey).not.toBe(alicePk);
    expect(() => openWrap(wrap, generateSecretKey())).toThrow();
  });
});

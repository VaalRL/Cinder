import { describe, expect, it, vi } from "vitest";
import { createHeartbeat } from "./heartbeat.js";
import { generateSecretKey } from "./keys.js";
import { RelayClient } from "./relay-client.js";

function setup() {
  const sent: string[] = [];
  const client = new RelayClient({ send: (d) => sent.push(d) });
  return { sent, client };
}

describe("RelayClient — 送出", () => {
  it("publish 送出 [\"EVENT\", event]", () => {
    const { sent, client } = setup();
    const e = createHeartbeat(generateSecretKey(), { created_at: 1 });
    client.publish(e);
    expect(JSON.parse(sent[0]!)).toEqual(["EVENT", e]);
  });

  it("subscribe 送出 [\"REQ\", subId, ...filters]", () => {
    const { sent, client } = setup();
    client.subscribe("s1", [{ kinds: [20000], authors: ["ab"] }]);
    expect(JSON.parse(sent[0]!)).toEqual(["REQ", "s1", { kinds: [20000], authors: ["ab"] }]);
  });

  it("unsubscribe 送出 [\"CLOSE\", subId]", () => {
    const { sent, client } = setup();
    client.unsubscribe("s1");
    expect(JSON.parse(sent[0]!)).toEqual(["CLOSE", "s1"]);
  });
});

describe("RelayClient — 接收分派", () => {
  it("EVENT/EOSE/OK/NOTICE 分派至對應 handler", () => {
    const onEvent = vi.fn();
    const onEose = vi.fn();
    const onOk = vi.fn();
    const onNotice = vi.fn();
    const client = new RelayClient({ send: () => {} }, { onEvent, onEose, onOk, onNotice });
    const e = createHeartbeat(generateSecretKey(), { created_at: 1 });

    client.receive(JSON.stringify(["EVENT", "s1", e]));
    client.receive(JSON.stringify(["EOSE", "s1"]));
    client.receive(JSON.stringify(["OK", e.id, true, ""]));
    client.receive(JSON.stringify(["NOTICE", "hello"]));

    expect(onEvent).toHaveBeenCalledWith("s1", e);
    expect(onEose).toHaveBeenCalledWith("s1");
    expect(onOk).toHaveBeenCalledWith(e.id, true, "");
    expect(onNotice).toHaveBeenCalledWith("hello");
  });

  it("非法訊息不丟例外", () => {
    const client = new RelayClient({ send: () => {} });
    expect(() => client.receive("not json")).not.toThrow();
    expect(() => client.receive(JSON.stringify(["???"]))).not.toThrow();
  });
});

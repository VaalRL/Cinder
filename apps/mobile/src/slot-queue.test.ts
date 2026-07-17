import { describe, expect, it } from "vitest";
import { activeCount, enqueueSlot, type MobileSlotItem, nextPending, removeSlot, retryFailed, setSlotStatus } from "./slot-queue.js";

const bytes = new Uint8Array([1, 2, 3]);
const mk = (name: string, queuedAt: number) => ({ name, size: 3, mime: "text/plain", origin: "Bob", bytes, queuedAt });

describe("行動端公司儲存槽佇列（ADR-0177）", () => {
  it("enqueueSlot：新增為 pending、帶 id；位元組原樣保留（web 無路徑）", () => {
    const q = enqueueSlot([], mk("a.txt", 100));
    expect(q).toHaveLength(1);
    expect(q[0]!.status).toBe("pending");
    expect(q[0]!.id).toContain("100-");
    expect(q[0]!.bytes).toBe(bytes);
  });

  it("nextPending：依排隊先後回第一個 pending；無 pending 回 undefined", () => {
    let q: MobileSlotItem[] = enqueueSlot([], mk("a", 1));
    q = enqueueSlot(q, mk("b", 2));
    expect(nextPending(q)!.name).toBe("a");
    q = setSlotStatus(q, q[0]!.id, "done");
    expect(nextPending(q)!.name).toBe("b");
    q = setSlotStatus(q, q[1]!.id, "sending");
    expect(nextPending(q)).toBeUndefined();
  });

  it("setSlotStatus／removeSlot／retryFailed／activeCount", () => {
    let q: MobileSlotItem[] = enqueueSlot(enqueueSlot([], mk("a", 1)), mk("b", 2));
    const idA = q[0]!.id;
    q = setSlotStatus(q, idA, "failed");
    expect(activeCount(q)).toBe(1); // 只剩 b 是 pending（a 失敗）
    q = retryFailed(q);
    expect(activeCount(q)).toBe(2); // a 重排回 pending
    q = removeSlot(q, idA);
    expect(q.map((x) => x.name)).toEqual(["b"]);
    expect(setSlotStatus(q, "nope", "done")).toEqual(q); // 未知 id 原樣
  });
});

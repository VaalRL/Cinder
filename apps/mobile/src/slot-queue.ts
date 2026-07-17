// 公司儲存槽佇列・員工端（ADR-0161／0177，行動端）：待存放檔案的本地佇列。
//
// 與桌面 `apps/desktop/src/ui/slot-queue.ts` 同一組狀態轉換，但**關鍵差異**：桌面存 `path`
// （傳輸時以 ADR-0103 路徑重讀原檔）；行動端 web **沒有持久檔案路徑**，故直接持有**位元組**。
// v1 為 session 內佇列（in-memory）——企業主於本次 session 上線即背景傳；durable 化（OPFS）
// 為後續。純函式可測；不進雲端、不外送 metadata（位元組經 P2P 直送企業主）。

export type SlotStatus = "pending" | "sending" | "done" | "failed";

export interface MobileSlotItem {
  /** 佇列項 id（queuedAt＋隨機尾碼）。 */
  id: string;
  name: string;
  size: number;
  mime: string;
  /** 來源對話標註（存放時的對話顯示名）。 */
  origin: string;
  /** 檔案位元組（行動端 web 無路徑可重讀，故直接持有）。 */
  bytes: Uint8Array;
  status: SlotStatus;
  queuedAt: number;
}

/** 加入佇列；回傳新陣列（不去重——行動端每次都是新挑的位元組，無路徑可比對）。 */
export function enqueueSlot(queue: MobileSlotItem[], item: Omit<MobileSlotItem, "id" | "status">): MobileSlotItem[] {
  const id = `${item.queuedAt}-${Math.random().toString(36).slice(2, 8)}`;
  return [...queue, { ...item, id, status: "pending" }];
}

/** 更新某項狀態；回傳新陣列（未知 id 原樣）。 */
export function setSlotStatus(queue: MobileSlotItem[], id: string, status: SlotStatus): MobileSlotItem[] {
  return queue.map((q) => (q.id === id ? { ...q, status } : q));
}

/** 移除某項。 */
export function removeSlot(queue: MobileSlotItem[], id: string): MobileSlotItem[] {
  return queue.filter((q) => q.id !== id);
}

/** 下一個待傳項（pending 依排隊先後）；無則 undefined。 */
export function nextPending(queue: MobileSlotItem[]): MobileSlotItem | undefined {
  return queue.find((q) => q.status === "pending");
}

/** 失敗項全部重排為待傳（重試）。 */
export function retryFailed(queue: MobileSlotItem[]): MobileSlotItem[] {
  return queue.map((q) => (q.status === "failed" ? { ...q, status: "pending" } : q));
}

/** 待傳／傳輸中的項數（供 UI 顯示「N 個待傳」）。 */
export function activeCount(queue: MobileSlotItem[]): number {
  return queue.filter((q) => q.status === "pending" || q.status === "sending").length;
}

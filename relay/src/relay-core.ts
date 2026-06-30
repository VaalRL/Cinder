import { verifyEvent, type NostrEvent } from "@nostr-buddy/core";
import { matchFilter } from "./filters.js";
import type { MessageStore } from "./message-store.js";
import {
  parseClientMessage,
  type RelayFilter,
  type RelayMessage,
} from "./protocol.js";

const EPHEMERAL_MIN = 20000;
const EPHEMERAL_MAX = 29999;

/** NIP-01：20000–29999 為 Ephemeral，中繼站不得持久化。 */
export function isEphemeral(kind: number): boolean {
  return kind >= EPHEMERAL_MIN && kind <= EPHEMERAL_MAX;
}

/** NIP-13：event id（hex）開頭的零位元數（工作量證明難度）。 */
export function leadingZeroBits(hex: string): number {
  let bits = 0;
  for (const ch of hex) {
    const nibble = Number.parseInt(ch, 16);
    if (Number.isNaN(nibble)) break;
    if (nibble === 0) {
      bits += 4;
      continue;
    }
    bits += Math.clz32(nibble) - 28;
    break;
  }
  return bits;
}

/** 要送往某連線的一則訊息。 */
export interface Outbound {
  to: string;
  message: RelayMessage;
}

export interface RelayCoreOptions {
  /**
   * 離線留言持久層（M2）。Ephemeral 事件**絕不會**寫入此處，
   * 以保證上線狀態/心跳純記憶體轉發、不寫資料庫。
   */
  store?: MessageStore;
  /** 取得目前 unix 秒（用於 NIP-40 過期判定）；預設為系統時鐘。 */
  now?: () => number;
  /** 每連線最大訂閱數；超過則拒絕新訂閱（防濫用）。 */
  maxSubscriptions?: number;
  /** 持久化事件所需的最小 NIP-13 PoW 難度（0 = 不要求）。 */
  minPowDifficulty?: number;
}

interface SubEntry {
  connId: string;
  subId: string;
  filters: RelayFilter[];
  /** 此訂閱所有 filter 指定的 kind 聯集（用於索引）。 */
  kinds: number[];
  /** 是否有 filter 未限制 kind（可匹配任何 kind）。 */
  anyKind: boolean;
}

/**
 * 傳輸無關的中繼核心：管理各連線的訂閱、驗證事件並對符合的訂閱扇出。
 * 訂閱以 kind 建立反向索引，事件進來只比對「對該 kind 有興趣」的訂閱，
 * 避免每個事件掃過全體訂閱（O(N²)）。由 Worker / Durable Object 注入收發。
 */
export class RelayCore {
  /** connId -> (subId -> entry)，權威來源。 */
  private readonly subs = new Map<string, Map<string, SubEntry>>();
  /** kind -> 對該 kind 有興趣的訂閱。 */
  private readonly byKind = new Map<number, Set<SubEntry>>();
  /** 未限制 kind（可匹配任何 kind）的訂閱。 */
  private readonly anyKindSubs = new Set<SubEntry>();

  constructor(private readonly opts: RelayCoreOptions = {}) {}

  private now(): number {
    return this.opts.now?.() ?? Math.floor(Date.now() / 1000);
  }

  connect(connId: string): void {
    if (!this.subs.has(connId)) this.subs.set(connId, new Map());
  }

  disconnect(connId: string): void {
    const conn = this.subs.get(connId);
    if (conn) for (const entry of conn.values()) this.unindex(entry);
    this.subs.delete(connId);
  }

  handle(connId: string, raw: string): Outbound[] {
    const msg = parseClientMessage(raw);
    switch (msg.type) {
      case "EVENT":
        return this.handleEvent(connId, msg.event);
      case "REQ":
        return this.handleReq(connId, msg.subId, msg.filters);
      case "CLOSE": {
        const conn = this.subs.get(connId);
        const entry = conn?.get(msg.subId);
        if (entry) {
          this.unindex(entry);
          conn?.delete(msg.subId);
        }
        return [{ to: connId, message: ["CLOSED", msg.subId, ""] }];
      }
      case "INVALID":
        return [{ to: connId, message: ["NOTICE", `invalid: ${msg.reason}`] }];
    }
  }

  private handleReq(connId: string, subId: string, filters: RelayFilter[]): Outbound[] {
    this.connect(connId);
    const conn = this.subs.get(connId)!;

    const cap = this.opts.maxSubscriptions;
    if (cap !== undefined && !conn.has(subId) && conn.size >= cap) {
      return [{ to: connId, message: ["CLOSED", subId, "rate-limited: 訂閱數已達上限"] }];
    }

    const previous = conn.get(subId);
    if (previous) this.unindex(previous);
    const entry = buildEntry(connId, subId, filters);
    conn.set(subId, entry);
    this.index(entry);

    const out: Outbound[] = [];
    if (this.opts.store) {
      const nowSec = this.now();
      const seen = new Set<string>();
      for (const filter of filters) {
        for (const event of this.opts.store.query(filter, nowSec)) {
          if (seen.has(event.id)) continue;
          seen.add(event.id);
          out.push({ to: connId, message: ["EVENT", subId, event] });
        }
      }
    }
    out.push({ to: connId, message: ["EOSE", subId] });
    return out;
  }

  private handleEvent(connId: string, event: NostrEvent): Outbound[] {
    if (!verifyEvent(event)) {
      return [{ to: connId, message: ["OK", event.id, false, "invalid: 簽章驗證失敗"] }];
    }

    // Ephemeral 純轉發、不寫 D1；其餘（持久化）需通過 PoW 並寫入持久層。
    if (!isEphemeral(event.kind)) {
      const minPow = this.opts.minPowDifficulty ?? 0;
      if (minPow > 0 && leadingZeroBits(event.id) < minPow) {
        return [{ to: connId, message: ["OK", event.id, false, `pow: 需要難度 ${minPow}`] }];
      }
      this.opts.store?.put(event, this.now());
    }

    const out: Outbound[] = [{ to: connId, message: ["OK", event.id, true, ""] }];
    const candidates = new Set<SubEntry>(this.byKind.get(event.kind));
    for (const entry of this.anyKindSubs) candidates.add(entry);
    for (const entry of candidates) {
      if (entry.filters.some((f) => matchFilter(f, event))) {
        out.push({ to: entry.connId, message: ["EVENT", entry.subId, event] });
      }
    }
    return out;
  }

  private index(entry: SubEntry): void {
    for (const kind of entry.kinds) {
      let set = this.byKind.get(kind);
      if (!set) {
        set = new Set();
        this.byKind.set(kind, set);
      }
      set.add(entry);
    }
    if (entry.anyKind) this.anyKindSubs.add(entry);
  }

  private unindex(entry: SubEntry): void {
    for (const kind of entry.kinds) {
      const set = this.byKind.get(kind);
      if (set) {
        set.delete(entry);
        if (set.size === 0) this.byKind.delete(kind);
      }
    }
    this.anyKindSubs.delete(entry);
  }
}

function buildEntry(connId: string, subId: string, filters: RelayFilter[]): SubEntry {
  const kinds = new Set<number>();
  let anyKind = false;
  for (const filter of filters) {
    if (filter.kinds && filter.kinds.length > 0) {
      for (const kind of filter.kinds) kinds.add(kind);
    } else {
      anyKind = true;
    }
  }
  return { connId, subId, filters, kinds: [...kinds], anyKind };
}

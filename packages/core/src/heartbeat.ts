import { KIND } from "./constants.js";
import { createEphemeralEvent } from "./ephemeral.js";
import type { NostrEvent } from "./event.js";
import type { SecretKey } from "./keys.js";

export interface HeartbeatOptions {
  /** Unix 秒；省略時填入現在。 */
  created_at?: number;
  /** 可選狀態字串（如正在聆聽音樂）；省略時 content 為空。 */
  status?: string;
}

/** 建立一筆已簽章的 Kind 20000 心跳事件（Ephemeral）。 */
export function createHeartbeat(sk: SecretKey, opts: HeartbeatOptions = {}): NostrEvent {
  return createEphemeralEvent(sk, KIND.HEARTBEAT, {
    created_at: opts.created_at,
    content: opts.status ?? "",
  });
}

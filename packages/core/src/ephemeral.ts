import type { NostrEvent } from "./event.js";
import type { SecretKey } from "./keys.js";
import { finalizeEvent } from "./sign.js";

export interface EphemeralOptions {
  /** Unix 秒；省略時填入現在。允許顯式 undefined 以便上層直接傳遞。 */
  created_at?: number | undefined;
  tags?: string[][] | undefined;
  content?: string | undefined;
}

/** 建立並簽署一筆 ephemeral 事件（心跳、輸入中、音樂狀態等共用）。 */
export function createEphemeralEvent(
  sk: SecretKey,
  kind: number,
  opts: EphemeralOptions = {},
): NostrEvent {
  return finalizeEvent(
    {
      kind,
      created_at: opts.created_at ?? Math.floor(Date.now() / 1000),
      tags: opts.tags ?? [],
      content: opts.content ?? "",
    },
    sk,
  );
}

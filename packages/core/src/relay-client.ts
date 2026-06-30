import type { NostrEvent } from "./event.js";
import type { Filter } from "./presence.js";

/** 實際的網路通道（瀏覽器 WebSocket / Tauri / 測試替身皆可注入）。 */
export interface RelayTransport {
  send(data: string): void;
}

export interface RelayClientHandlers {
  onEvent?: (subId: string, event: NostrEvent) => void;
  onEose?: (subId: string) => void;
  onOk?: (eventId: string, accepted: boolean, message: string) => void;
  onNotice?: (message: string) => void;
}

/**
 * 與平台無關的 Nostr relay 客戶端：負責序列化送出與解析分派。
 * 由宿主持有實際 WebSocket，在收到訊息時呼叫 {@link RelayClient.receive}。
 */
export class RelayClient {
  constructor(
    private readonly transport: RelayTransport,
    private readonly handlers: RelayClientHandlers = {},
  ) {}

  /** 發布事件至中繼站。 */
  publish(event: NostrEvent): void {
    this.transport.send(JSON.stringify(["EVENT", event]));
  }

  /** 以一組 filter 建立訂閱。 */
  subscribe(subId: string, filters: Filter[]): void {
    this.transport.send(JSON.stringify(["REQ", subId, ...filters]));
  }

  /** 關閉訂閱。 */
  unsubscribe(subId: string): void {
    this.transport.send(JSON.stringify(["CLOSE", subId]));
  }

  /** 餵入自中繼站收到的原始訊息字串並分派。非法訊息將被忽略。 */
  receive(raw: string): void {
    let msg: unknown;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (!Array.isArray(msg)) return;

    switch (msg[0]) {
      case "EVENT":
        if (typeof msg[1] === "string" && msg[2]) {
          this.handlers.onEvent?.(msg[1], msg[2] as NostrEvent);
        }
        return;
      case "EOSE":
        if (typeof msg[1] === "string") this.handlers.onEose?.(msg[1]);
        return;
      case "OK":
        if (typeof msg[1] === "string") {
          this.handlers.onOk?.(msg[1], Boolean(msg[2]), String(msg[3] ?? ""));
        }
        return;
      case "NOTICE":
        if (typeof msg[1] === "string") this.handlers.onNotice?.(msg[1]);
        return;
      default:
        return;
    }
  }
}

import { RelayClient } from "@nostr-buddy/core";
import type { HeartbeatLike } from "./presence-store.js";

/**
 * 以瀏覽器/webview 的原生 WebSocket 連上中繼站，訂閱好友心跳並轉成
 * {@link HeartbeatLike} 推送給 UI。回傳取消訂閱（關閉連線）函式，
 * 可直接作為 `App` 的 `subscribeHeartbeats`。
 *
 * 註：真正的背景長連線由 Tauri/Rust 側負責（M1-T9）；此轉接器供前景
 * 視窗與純瀏覽器預覽使用。
 */
export function createRelaySource(url: string, friendPubkeys: string[]) {
  return (onEvent: (e: HeartbeatLike) => void): (() => void) => {
    const ws = new WebSocket(url);
    const client = new RelayClient(
      { send: (data) => ws.send(data) },
      { onEvent: (_subId, event) => onEvent(event) },
    );
    ws.addEventListener("message", (ev: MessageEvent) => {
      client.receive(typeof ev.data === "string" ? ev.data : "");
    });
    ws.addEventListener("open", () => {
      client.subscribe("presence", [{ kinds: [20000], authors: friendPubkeys }]);
    });
    return () => ws.close();
  };
}

import type { CallFailureReason, PubkeyHex } from "@cinderous/core";
import { generateSecretKey, getPublicKey } from "@cinderous/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WebRtcCall } from "./webrtc-call.js";

// 最小 RTCPeerConnection 樁：捕捉最後建立的 pc，供測試手動觸發連上/失敗（node 無真實 WebRTC）。
let lastPc: FakePc | undefined;
class FakePc {
  onicecandidate: unknown = null;
  ontrack: unknown = null;
  onconnectionstatechange: (() => void) | null = null;
  connectionState = "new";
  constructor() {
    lastPc = this;
  }
  async createOffer(): Promise<{ type: string; sdp: string }> {
    return { type: "offer", sdp: "" };
  }
  async createAnswer(): Promise<{ type: string; sdp: string }> {
    return { type: "answer", sdp: "" };
  }
  async setLocalDescription(): Promise<void> {}
  async setRemoteDescription(): Promise<void> {}
  async addIceCandidate(): Promise<void> {}
  addTrack(): void {}
  close(): void {}
}

describe("WebRtcCall 通話失敗提示（ADR-0243）", () => {
  afterEach(() => vi.unstubAllGlobals());

  const setup = () => {
    vi.stubGlobal("RTCPeerConnection", FakePc);
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [] }) } });
    lastPc = undefined;
    const failed: Array<[PubkeyHex, CallFailureReason]> = [];
    const sk = generateSecretKey();
    const peer = getPublicKey(generateSecretKey());
    const call = new WebRtcCall(sk, {
      publishCallSignal: () => {},
      onState: () => {},
      onLocalStream: () => {},
      onRemoteStream: () => {},
      onError: () => {},
      onFailed: (p, reason) => failed.push([p, reason]),
    });
    call.startCall(peer, "audio"); // ensurePc 同步建立 pc 並掛好 onconnectionstatechange
    return { peer, failed };
  };

  it("連線從未打通就失敗 → onFailed(peer, 'unreachable')（限制網路提示）", () => {
    const { peer, failed } = setup();
    lastPc!.connectionState = "failed";
    lastPc!.onconnectionstatechange!();
    expect(failed).toEqual([[peer, "unreachable"]]);
  });

  it("已連上後中途斷線 → onFailed(peer, 'lost')", () => {
    const { peer, failed } = setup();
    lastPc!.connectionState = "connected";
    lastPc!.onconnectionstatechange!();
    lastPc!.connectionState = "failed";
    lastPc!.onconnectionstatechange!();
    expect(failed).toEqual([[peer, "lost"]]);
  });

  it("連上但未失敗 → 不提示", () => {
    const { failed } = setup();
    lastPc!.connectionState = "connected";
    lastPc!.onconnectionstatechange!();
    expect(failed).toEqual([]);
  });
});

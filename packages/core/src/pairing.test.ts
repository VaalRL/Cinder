import { describe, expect, it } from "vitest";
import {
  createPairing,
  decryptBundle,
  encodePairing,
  encryptBundle,
  parsePairing,
} from "./pairing.js";

describe("QR 配對載荷", () => {
  it("createPairing 產生 32-byte 一次性金鑰與含 lan/room 的載荷", () => {
    const { payload, key } = createPairing("192.168.1.5", "room-abc");
    expect(key).toBeInstanceOf(Uint8Array);
    expect(key.length).toBe(32);
    expect(payload.lan).toBe("192.168.1.5");
    expect(payload.room).toBe("room-abc");
    expect(payload.v).toBe(1);
  });

  it("編碼後可解析回相同金鑰與欄位", () => {
    const { payload, key } = createPairing("10.0.0.2", "r1");
    const parsed = parsePairing(encodePairing(payload));
    expect(parsed.payload).toEqual(payload);
    expect(Buffer.from(parsed.key).equals(Buffer.from(key))).toBe(true);
  });

  it("版本不符或格式錯誤時拋錯", () => {
    expect(() => parsePairing("not json")).toThrow();
    expect(() => parsePairing(JSON.stringify({ v: 2, key: "x", lan: "a", room: "b" }))).toThrow();
  });
});

describe("同步包 AES-256-GCM 加解密", () => {
  it("以一次性金鑰往返加解密", () => {
    const { key } = createPairing("a", "b");
    const plaintext = new TextEncoder().encode("整包 SQLite 與私鑰 🔐");
    const blob = encryptBundle(key, plaintext);
    expect(Buffer.from(decryptBundle(key, blob)).equals(Buffer.from(plaintext))).toBe(true);
  });

  it("每次密文不同（隨機 nonce）", () => {
    const { key } = createPairing("a", "b");
    const pt = new TextEncoder().encode("same");
    expect(Buffer.from(encryptBundle(key, pt)).equals(Buffer.from(encryptBundle(key, pt)))).toBe(false);
  });

  it("錯誤金鑰或遭竄改的密文無法解密", () => {
    const { key } = createPairing("a", "b");
    const blob = encryptBundle(key, new TextEncoder().encode("secret"));
    const { key: wrong } = createPairing("a", "b");
    expect(() => decryptBundle(wrong, blob)).toThrow();
    const tampered = Uint8Array.from(blob);
    const last = tampered.length - 1;
    tampered[last] = (tampered[last] ?? 0) ^ 0xff;
    expect(() => decryptBundle(key, tampered)).toThrow();
  });
});

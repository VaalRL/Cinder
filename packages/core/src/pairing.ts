import { gcm } from "@noble/ciphers/aes.js";
import { randomBytes } from "@noble/hashes/utils";
import { base64 } from "@scure/base";

/**
 * QR Code 配對載荷：僅含「一次性 AES-256-GCM 金鑰、內網 IP、WebRTC 房間號」。
 * 不含任何明文資料；掃描後雙方以該金鑰建立 AEAD 通道傳輸 SQLite 與私鑰。
 */
export interface PairingPayload {
  v: 1;
  /** base64 編碼的 32-byte AES-256 金鑰。 */
  key: string;
  /** 內網 IP（LAN 直連用）。 */
  lan: string;
  /** WebRTC 房間號（WAN 打洞用）。 */
  room: string;
}

const KEY_BYTES = 32;
const NONCE_BYTES = 12;

/** 產生一份新的配對載荷與其原始一次性金鑰（金鑰用後即焚）。 */
export function createPairing(lan: string, room: string): { payload: PairingPayload; key: Uint8Array } {
  const key = randomBytes(KEY_BYTES);
  return { payload: { v: 1, key: base64.encode(key), lan, room }, key };
}

/** 將配對載荷編碼為 QR 內容字串。 */
export function encodePairing(payload: PairingPayload): string {
  return JSON.stringify(payload);
}

/** 解析 QR 內容；版本不符或格式錯誤時拋錯。 */
export function parsePairing(qr: string): { payload: PairingPayload; key: Uint8Array } {
  const payload = JSON.parse(qr) as PairingPayload;
  if (payload.v !== 1 || typeof payload.key !== "string") {
    throw new Error("配對載荷版本不符或格式錯誤");
  }
  const key = base64.decode(payload.key);
  if (key.length !== KEY_BYTES) throw new Error("配對金鑰長度錯誤");
  return { payload, key };
}

/** 以一次性金鑰 AES-256-GCM 加密同步包；輸出為 `nonce || ciphertext`。 */
export function encryptBundle(key: Uint8Array, plaintext: Uint8Array): Uint8Array {
  const nonce = randomBytes(NONCE_BYTES);
  const ciphertext = gcm(key, nonce).encrypt(plaintext);
  const out = new Uint8Array(NONCE_BYTES + ciphertext.length);
  out.set(nonce);
  out.set(ciphertext, NONCE_BYTES);
  return out;
}

/** 解密 `nonce || ciphertext`；金鑰錯誤或遭竄改時拋錯（GCM 驗證失敗）。 */
export function decryptBundle(key: Uint8Array, blob: Uint8Array): Uint8Array {
  const nonce = blob.subarray(0, NONCE_BYTES);
  const ciphertext = blob.subarray(NONCE_BYTES);
  return gcm(key, nonce).decrypt(ciphertext);
}

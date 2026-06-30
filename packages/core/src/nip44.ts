import { nip44 } from "nostr-tools";
import type { PubkeyHex, SecretKey } from "./keys.js";

/**
 * NIP-44 v2 加密的薄包裝。密碼學原語委由審計過的 `nostr-tools/nip44`
 * （底層 @noble）；事件/簽章仍由本 core 自有實作（見 docs/adr/0007）。
 *
 * conversation key 具對稱性：`(senderSk, recipientPk)` 與
 * `(recipientSk, senderPk)` 導出相同金鑰。
 */
export function encryptDM(
  plaintext: string,
  senderSk: SecretKey,
  recipientPk: PubkeyHex,
): string {
  const key = nip44.getConversationKey(senderSk, recipientPk);
  return nip44.encrypt(plaintext, key);
}

/** 以收件人私鑰與寄件人公鑰解出 NIP-44 密文。金鑰不符時拋錯。 */
export function decryptDM(
  ciphertext: string,
  recipientSk: SecretKey,
  senderPk: PubkeyHex,
): string {
  const key = nip44.getConversationKey(recipientSk, senderPk);
  return nip44.decrypt(ciphertext, key);
}

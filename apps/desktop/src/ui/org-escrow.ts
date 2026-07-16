// 入職金鑰託管（ADR-0163，管理者端）：公司帳號成員入職時託管的私鑰，供日後離職接管。
// 依管理者身分命名空間持久化（localStorage；在 Tauri 下另隨加密儲存不適用——這是 UI 層
// 便利索引，nsec 本身抵達時已 E2E 解出）。純函式，可測。

export interface EscrowEntry {
  /** 成員 hex pubkey。 */
  pubkey: string;
  /** 入職時的顯示名。 */
  name: string;
  /** 託管私鑰（nsec）。 */
  nsec: string;
  /** 成員身分鎖定的公司 relay（接管登入用）。 */
  relayUrl: string;
  /** 託管到達時間（ms）。 */
  at: number;
}

const PREFIX = "nb.orgEscrow.";

/** 加入/更新一筆託管（以 pubkey 為鍵）；回傳新陣列。 */
export function upsertEscrow(list: EscrowEntry[], entry: EscrowEntry): EscrowEntry[] {
  const rest = list.filter((e) => e.pubkey !== entry.pubkey);
  return [...rest, entry];
}

/** 移除一筆託管。 */
export function removeEscrow(list: EscrowEntry[], pubkey: string): EscrowEntry[] {
  return list.filter((e) => e.pubkey !== pubkey);
}

/**
 * 已離職（可接管）的託管條目（ADR-0163）：託管中、但**不在現行名冊在世成員**內者
 * ＝已被移出名冊＝離職。`liveMembers` 為現行名冊在世成員 pubkey 集合。
 */
export function offboardedEntries(list: EscrowEntry[], liveMembers: Set<string>): EscrowEntry[] {
  return list.filter((e) => !liveMembers.has(e.pubkey));
}

export function loadEscrow(adminPubkey: string): EscrowEntry[] {
  try {
    const raw = localStorage.getItem(PREFIX + adminPubkey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is EscrowEntry =>
        !!e &&
        typeof e === "object" &&
        typeof (e as EscrowEntry).pubkey === "string" &&
        typeof (e as EscrowEntry).nsec === "string" &&
        typeof (e as EscrowEntry).name === "string",
    );
  } catch {
    return [];
  }
}

export function saveEscrow(adminPubkey: string, list: EscrowEntry[]): void {
  try {
    localStorage.setItem(PREFIX + adminPubkey, JSON.stringify(list));
  } catch {
    /* 配額或不可用時忽略 */
  }
}

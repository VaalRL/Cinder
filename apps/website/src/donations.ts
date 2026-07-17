// 官方捐款導流管道（ADR-0089/0090）：純外部連結，無站內托管/錢包/抽成、不採 Zap。
// 暫時只開 Buy Me a Coffee（真實帳號）；GitHub Sponsors／Liberapay／Lightning 待正式上線再開，
// 佔位連結先移除以免點擊 404。型別保留四管道，日後重新加回陣列即可。
export type DonationChannel = "github_sponsors" | "buy_me_a_coffee" | "liberapay" | "lightning";

export interface DonationLink {
  channel: DonationChannel;
  label: string;
  /** URL 類以瀏覽器開；lightning 以 `lightning:` deep link 交外部錢包。 */
  url: string;
}

export const OFFICIAL_DONATIONS: DonationLink[] = [
  { channel: "buy_me_a_coffee", label: "Buy Me a Coffee", url: "https://buymeacoffee.com/whoami885" },
];

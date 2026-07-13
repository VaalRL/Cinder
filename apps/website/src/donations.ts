// 官方捐款導流管道（ADR-0089/0090 共用 4 管道）：純外部連結，無站內托管/錢包/抽成、不採 Zap。
// ⚠️ 佔位連結；正式上線前換成真實帳號。
export type DonationChannel = "github_sponsors" | "buy_me_a_coffee" | "liberapay" | "lightning";

export interface DonationLink {
  channel: DonationChannel;
  label: string;
  /** URL 類以瀏覽器開；lightning 以 `lightning:` deep link 交外部錢包。 */
  url: string;
}

export const OFFICIAL_DONATIONS: DonationLink[] = [
  { channel: "github_sponsors", label: "GitHub Sponsors", url: "https://github.com/sponsors/cinder-placeholder" },
  { channel: "buy_me_a_coffee", label: "Buy Me a Coffee", url: "https://buymeacoffee.com/cinder-placeholder" },
  { channel: "liberapay", label: "Liberapay", url: "https://liberapay.com/cinder-placeholder" },
  { channel: "lightning", label: "Lightning", url: "lightning:cinder-placeholder@example.com" },
];

// 威脅情報組態 context（ADR-0231 P3）：App 供應 matcher＋模式旗標，訊息渲染（遮罩）
// 與送出端（警示／阻止）共用。無 provider 時預設全關＝渲染照舊（測試/示範不受影響）。
import { createContext, useContext } from "react";
import type { ThreatMatcher } from "./url-hygiene.js";

export interface ThreatConfig {
  /** 命中比對 matcher；null＝停用或無資料（不遮罩、不警示）。 */
  matcher: ThreatMatcher | null;
  /** 送出端警示（設定可關）。 */
  sendWarn: boolean;
  /** 嚴格模式：遮罩不可展開＋送出阻止（企業政策可強制）。 */
  strict: boolean;
}

export const DEFAULT_THREAT: ThreatConfig = { matcher: null, sendWarn: true, strict: false };

const Ctx = createContext<ThreatConfig>(DEFAULT_THREAT);

export const ThreatProvider = Ctx.Provider;

export function useThreat(): ThreatConfig {
  return useContext(Ctx);
}

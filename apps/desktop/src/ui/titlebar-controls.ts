// 自繪標題列按鈕設定（ADR-0150）：位置（左/右）與順序（─ □ ✕ 任意排）的純函式核心。
// 設定存 localStorage（純本地 UI 偏好，不上雲、不隨快照）；解析永遠回有效值——
// 設定損壞時視窗仍要有可用的關閉鈕，這裡不能丟例外。

export type ControlId = "min" | "max" | "close";

export interface TitlebarControls {
  /** 按鈕靠哪一側（Windows 慣例＝右、macOS 慣例＝左）。 */
  side: "left" | "right";
  /** 按鈕由左至右的順序（三顆各一次）。 */
  order: ControlId[];
}

export const CONTROL_IDS: readonly ControlId[] = ["min", "max", "close"];

export const DEFAULT_TITLEBAR_CONTROLS: TitlebarControls = { side: "right", order: ["min", "max", "close"] };

/** localStorage 鍵。 */
export const TITLEBAR_CONTROLS_KEY = "nb.titlebarControls";

/**
 * 解析設定：壞 JSON／非物件 → 預設；order 剔除未知 id、去重、缺漏依預設順序補齊；
 * side 只認 left/right（其餘退回 right）。
 */
export function parseTitlebarControls(raw: string | null | undefined): TitlebarControls {
  if (!raw) return DEFAULT_TITLEBAR_CONTROLS;
  try {
    const v = JSON.parse(raw) as { side?: unknown; order?: unknown };
    if (typeof v !== "object" || v === null) return DEFAULT_TITLEBAR_CONTROLS;
    const side: TitlebarControls["side"] = v.side === "left" ? "left" : "right";
    const seen = new Set<ControlId>();
    const order: ControlId[] = [];
    if (Array.isArray(v.order)) {
      for (const id of v.order) {
        if ((CONTROL_IDS as readonly string[]).includes(id as string) && !seen.has(id as ControlId)) {
          seen.add(id as ControlId);
          order.push(id as ControlId);
        }
      }
    }
    for (const id of CONTROL_IDS) if (!seen.has(id)) order.push(id);
    return { side, order };
  } catch {
    return DEFAULT_TITLEBAR_CONTROLS;
  }
}

export function serializeTitlebarControls(c: TitlebarControls): string {
  return JSON.stringify(c);
}

/** 設定 UI 的 ←/→：把 `id` 往前(-1)/後(+1)移一格；到邊界或找不到即原樣返回（不就地改）。 */
export function moveControl(order: ControlId[], id: ControlId, dir: -1 | 1): ControlId[] {
  const i = order.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= order.length) return order;
  const next = [...order];
  next[i] = next[j]!;
  next[j] = id;
  return next;
}

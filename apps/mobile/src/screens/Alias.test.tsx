// 行動端本地暱稱（ADR-0148）：對話標頭顯示暱稱、點名字切換廣播名、✎ 展開設定列。
// SSR 可斷言 testID 與顯示文字（顯示層），互動（點擊切換）留給資料層與桌面測試覆蓋。

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConversationScreen } from "./ConversationScreen.js";

const base = {
  messages: [],
  onSend: () => {},
  onBack: () => {},
  locale: "zh-Hant" as const,
};

describe("行動端本地暱稱（ADR-0148）", () => {
  it("有暱稱＋onSetAlias → 標頭顯示暱稱、名字可點、有 ✎ 入口", () => {
    const html = renderToStaticMarkup(
      <ConversationScreen {...base} name="阿伯" broadcastName="Bob" alias="阿伯" onSetAlias={() => {}} />,
    );
    expect(html).toContain('data-testid="convo-title-name"');
    expect(html).toContain("阿伯"); // 顯示暱稱（name 已由呼叫端帶入暱稱）
    expect(html).toContain('data-testid="convo-alias-edit"'); // ✎
  });

  it("未提供 onSetAlias（群組/示範）→ 無 ✎ 入口", () => {
    const html = renderToStaticMarkup(<ConversationScreen {...base} name="工作群" />);
    expect(html).not.toContain('data-testid="convo-alias-edit"');
  });
});

import type { MessageArchive, StoredMessage } from "@cinder/engine";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConversationScreen } from "./ConversationScreen.js";
import { HistoryScreen } from "./HistoryScreen.js";

/** 空封存替身（SSR 渲染不跑 effect，故只驗靜態結構；分頁邏輯在 engine 已測）。 */
const emptyArchive: MessageArchive = {
  append: () => Promise.resolve(),
  chunkCount: () => Promise.resolve(0),
  loadChunk: () => Promise.resolve([] as StoredMessage[]),
  remove: () => Promise.resolve(),
};

describe("行動端歷史紀錄（ADR-0111）", () => {
  it("渲染標題與對話名（en）", () => {
    const html = renderToStaticMarkup(
      <HistoryScreen name="Bob" convo="bob" archive={emptyArchive} selfLabel="Me" onBack={() => {}} locale="en" />,
    );
    expect(html).toContain("History"); // translate(en, history_title)
    expect(html).toContain("Bob");
  });

  it("對話畫面：**有封存才顯示** 🗄 入口", () => {
    const base = { name: "Bob", messages: [], onSend: () => {}, onBack: () => {}, locale: "en" as const };
    const without = renderToStaticMarkup(<ConversationScreen {...base} />);
    expect(without).not.toContain("🗄");

    const withHistory = renderToStaticMarkup(<ConversationScreen {...base} onHistory={() => {}} />);
    expect(withHistory).toContain("🗄");
  });
});

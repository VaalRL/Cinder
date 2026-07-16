import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "../i18n.js";
import { TitleBar, type TitleBarActions } from "./TitleBar.js";
import type { TitlebarControls } from "./titlebar-controls.js";

const noop: TitleBarActions = { minimize() {}, toggleMaximize() {}, close() {} };

const render = (controls?: TitlebarControls, preview?: boolean): string =>
  renderToStaticMarkup(
    <I18nProvider locale="zh-Hant">
      <TitleBar actions={noop} {...(controls ? { controls } : {})} {...(preview ? { preview } : {})} />
    </I18nProvider>,
  );

describe("TitleBar 自繪視窗標題列（ADR-0150）", () => {
  it("預設：拖曳區＋標題＋右側依序 ─ □ ✕", () => {
    const html = render();
    expect(html).toContain("data-tauri-drag-region"); // 拖曳＋雙擊最大化（Tauri 內建）
    expect(html).toContain("Cinder");
    const iTitle = html.indexOf("titlebar__title");
    const iMin = html.indexOf('data-testid="titlebar-min"');
    const iMax = html.indexOf('data-testid="titlebar-max"');
    const iClose = html.indexOf('data-testid="titlebar-close"');
    expect(iTitle).toBeGreaterThanOrEqual(0);
    // 右側：標題在前、按鈕在後，順序 ─ □ ✕
    expect(iTitle).toBeLessThan(iMin);
    expect(iMin).toBeLessThan(iMax);
    expect(iMax).toBeLessThan(iClose);
  });

  it("side=left → 按鈕在標題前；order 自訂依序渲染", () => {
    const html = render({ side: "left", order: ["close", "min", "max"] });
    const iTitle = html.indexOf("titlebar__title");
    const iMin = html.indexOf('data-testid="titlebar-min"');
    const iMax = html.indexOf('data-testid="titlebar-max"');
    const iClose = html.indexOf('data-testid="titlebar-close"');
    expect(iClose).toBeLessThan(iMin);
    expect(iMin).toBeLessThan(iMax);
    expect(iMax).toBeLessThan(iTitle); // 按鈕整組在標題前
  });

  it("preview 模式：加 titlebar--preview（設定頁迷你預覽、不可互動）", () => {
    expect(render(undefined, true)).toContain("titlebar--preview");
    expect(render()).not.toContain("titlebar--preview");
  });
});

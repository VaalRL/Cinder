import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "./i18n.js";
import { TitlebarProvider, WindowChrome } from "./titlebar.js";

describe("WindowChrome 自繪外框殼層（ADR-0150）", () => {
  it("瀏覽器模式（非 Tauri）→ 原樣透傳、不畫標題列", () => {
    const html = renderToStaticMarkup(
      <I18nProvider locale="zh-Hant">
        <TitlebarProvider>
          <WindowChrome>
            <div>內容照舊</div>
          </WindowChrome>
        </TitlebarProvider>
      </I18nProvider>,
    );
    expect(html).toContain("內容照舊");
    expect(html).not.toContain("titlebar"); // 外框是瀏覽器的，這裡不畫
  });
});

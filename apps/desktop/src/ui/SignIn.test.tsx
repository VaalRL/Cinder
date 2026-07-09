import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { I18nProvider } from "../i18n.js";
import { ThemeProvider } from "../theme.js";
import { autoRelayCandidates, initialRelayUrl, SignIn } from "./SignIn.js";

describe("自動選座候選（ADR-0069 I4）", () => {
  it("錨點加權隨機排序（預設權重相等）；無錨點回空＝行為不變", () => {
    const seq = [0.9, 0];
    let i = 0;
    expect(autoRelayCandidates(["wss://a", "wss://b"], () => seq[i++] ?? 0)).toEqual(["wss://b", "wss://a"]);
    expect(autoRelayCandidates([], () => 0.5)).toEqual([]);
  });
});

describe("relay 欄位預設值（記住上次使用的網址）", () => {
  it("?relay= 參數優先於本地記憶", () => {
    expect(initialRelayUrl("?relay=wss://a.example", "wss://b.example")).toBe("wss://a.example");
  });

  it("無參數時回退到上次使用的網址", () => {
    expect(initialRelayUrl("", "wss://b.example")).toBe("wss://b.example");
  });

  it("兩者皆無時為空字串", () => {
    expect(initialRelayUrl("", null)).toBe("");
  });
});

describe("SignIn 元件", () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).localStorage;
  });

  it("relay 欄位預填上次使用的網址", () => {
    (globalThis as Record<string, unknown>).window = {
      location: { search: "" },
      matchMedia: () => ({ matches: false }),
    };
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (key: string) => (key === "nb.relayUrl" ? "wss://last.example" : null),
    };
    const out = renderToStaticMarkup(
      <ThemeProvider>
        <I18nProvider locale="zh-Hant">
          <SignIn onSignIn={() => {}} />
        </I18nProvider>
      </ThemeProvider>,
    );
    expect(out).toContain('value="wss://last.example"');
  });

  it("無記憶時 relay 欄位為空", () => {
    const out = renderToStaticMarkup(
      <ThemeProvider>
        <I18nProvider locale="zh-Hant">
          <SignIn onSignIn={() => {}} />
        </I18nProvider>
      </ThemeProvider>,
    );
    expect(out).not.toContain("wss://last.example");
  });
});

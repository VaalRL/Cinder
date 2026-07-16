import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { I18nProvider } from "../i18n.js";
import { Avatar, EditableAvatar } from "./Avatar.js";
import { setAvatar, setBroadcastAvatars } from "./personalize.js";

const render = (node: JSX.Element) => renderToStaticMarkup(<I18nProvider locale="zh-Hant">{node}</I18nProvider>);

describe("Avatar 自訂/生成分支（ADR-0077 O2）", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
  });
  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it("無自訂圖：渲染生成頭像（名字首字）", () => {
    const html = render(<Avatar id="pkX" name="Amy" />);
    expect(html).toContain(">A<"); // 首字
    expect(html).not.toContain("background-image");
  });

  it("有自訂圖：渲染背景圖、不顯示首字", () => {
    setAvatar("pkX", "data:image/jpeg;base64,ZZZ");
    const html = render(<Avatar id="pkX" name="Amy" />);
    expect(html).toContain("background-image");
    expect(html).toContain("data:image/jpeg;base64,ZZZ");
    expect(html).not.toContain(">A<");
  });

  it("廣播頭像後備（ADR-0154）：無本地覆寫時用對方廣播圖；本地覆寫恒優先", () => {
    setBroadcastAvatars([["pkB", "data:image/png;base64,BCAST"]]);
    // 只有廣播 → 用廣播圖
    let html = render(<Avatar id="pkB" name="Bob" />);
    expect(html).toContain("data:image/png;base64,BCAST");
    // 本地覆寫（ADR-0077）恒優先於廣播（同 ADR-0148 本地暱稱哲學）
    setAvatar("pkB", "data:image/jpeg;base64,LOCAL");
    html = render(<Avatar id="pkB" name="Bob" />);
    expect(html).toContain("data:image/jpeg;base64,LOCAL");
    expect(html).not.toContain("BCAST");
    setBroadcastAvatars([]); // 清空快取，不外漏到其他測試
  });
});

describe("EditableAvatar 選單（ADR-0154）", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
  });
  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it("選單含「更換」與「從網址設定…」；帶 onBroadcast 時顯示「會同步給聯絡人」提示", () => {
    const html = render(<EditableAvatar id="me" name="Me" initialMenu onBroadcast={() => true} />);
    expect(html).toContain("更換頭像");
    expect(html).toContain('data-testid="avatar-from-url"');
    expect(html).toContain("從網址設定…");
    expect(html).toContain("會同步給聯絡人");
  });

  it("不帶 onBroadcast（聯絡人的本地頭像）：無同步提示，仍可從網址設定", () => {
    const html = render(<EditableAvatar id="pkC" name="C" initialMenu />);
    expect(html).not.toContain("會同步給聯絡人");
    expect(html).toContain('data-testid="avatar-from-url"');
  });
});

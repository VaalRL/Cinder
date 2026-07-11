import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PairBundle } from "@cinder/engine";
import { NsecSignInScreen } from "./NsecSignInScreen.js";
import { PairImportScreen } from "./PairImportScreen.js";

// 畫面互動（輸入/按鈕）在 renderToStaticMarkup 下不會執行，登入邏輯由 auth.test.ts 把關；
// 此處確保兩畫面在深色＋自訂主色下靜態渲染出標題/入口、且吃 @cinder/theme（ADR-0080/0081）。
describe("行動端登入畫面（ADR-0081）", () => {
  it("NsecSignInScreen（A）：渲染標題與切換配對入口（en）", () => {
    const html = renderToStaticMarkup(
      <NsecSignInScreen
        onSignIn={() => {}}
        onUsePairing={() => {}}
        locale="en"
        theme="dark"
        accent="#2f6cd6"
        accent2="#e2632b"
      />,
    );
    expect(html).toContain("Sign in with key"); // msignin_title
    expect(html).toContain("Use pairing instead"); // msignin_toPair
  });

  it("PairImportScreen（B）：渲染標題與切換金鑰入口（zh）", () => {
    const html = renderToStaticMarkup(
      <PairImportScreen
        onPair={() => Promise.resolve({} as PairBundle)}
        onSignIn={() => {}}
        onUseNsec={() => {}}
        locale="zh-Hant"
        theme="light"
      />,
    );
    expect(html).toContain("配對匯入"); // mpair_title
    expect(html).toContain("改用金鑰登入"); // mpair_toNsec
  });
});

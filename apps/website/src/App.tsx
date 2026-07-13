import { useEffect, useState } from "react";
import type { Locale } from "@cinder/i18n";
import { resolveTheme, type Theme } from "@cinder/theme";
import { CinderMark } from "./Brand.js";
import { useCopy } from "./copy.js";
import { Home } from "./pages/Home.js";
import { Transparency } from "./pages/Transparency.js";

export const GITHUB_URL = "https://github.com/VaalRL/Nostr-buddy";

type View = "home" | "transparency";

function initialTheme(): Theme {
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function App(): JSX.Element {
  const [view, setView] = useState<View>("home");
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [locale, setLocale] = useState<Locale>("zh-Hant");
  const c = useCopy(locale);

  // 主題色吃 @cinder/theme（與 app 同 SSOT），映射為 CSS 變數供 styles.css。
  useEffect(() => {
    const tk = resolveTheme({ theme });
    const root = document.documentElement;
    const vars: Record<string, string> = {
      "--bg": tk.bgB,
      "--ink": tk.ink,
      "--muted": tk.muted,
      "--accent": tk.accent,
      "--panel": tk.panel,
      "--surface": tk.surface2,
      "--border": tk.border,
    };
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    document.documentElement.lang = locale;
  }, [theme, locale]);

  return (
    <>
      <nav className="nav">
        <div className="nav__inner">
          <span className="nav__brand">
            <CinderMark size={26} /> Cinder
          </span>
          <span className="nav__spacer" />
          <button type="button" className={`nav__link${view === "home" ? " on" : ""}`} onClick={() => setView("home")}>
            {c.nav_home}
          </button>
          <button
            type="button"
            className={`nav__link${view === "transparency" ? " on" : ""}`}
            onClick={() => setView("transparency")}
          >
            {c.nav_transparency}
          </button>
          <button type="button" className="nav__toggle" onClick={() => setLocale(locale === "zh-Hant" ? "en" : "zh-Hant")}>
            {locale === "zh-Hant" ? "EN" : "繁中"}
          </button>
          <button
            type="button"
            className="nav__toggle"
            aria-label="theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
      </nav>

      {view === "home" ? <Home c={c} /> : <Transparency c={c} />}

      <footer className="footer">
        <div className="wrap">{c.footer_privacy}</div>
      </footer>
    </>
  );
}

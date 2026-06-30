import { useI18n } from "../i18n.js";
import { useTheme } from "../theme.js";
import { LanguageSwitcher } from "./LanguageSwitcher.js";

/** 視窗標題列右側控制：主題切換 + 語言切換。 */
export function TitleControls(): JSX.Element {
  const { t } = useI18n();
  const { theme, toggle } = useTheme();
  return (
    <span className="titlectl">
      <button
        type="button"
        className="themebtn"
        aria-label={t("theme_toggle")}
        aria-pressed={theme === "dark"}
        title={t("theme_toggle")}
        onClick={toggle}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
      <LanguageSwitcher />
    </span>
  );
}

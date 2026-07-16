import { type ChangeEvent, type CSSProperties, useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n.js";
import { useDialog } from "./Dialog.js";
import {
  AVATAR_MAX_EDGE,
  downscaleImage,
  getAvatar,
  getBroadcastAvatar,
  removeAvatar,
  setAvatar,
  subscribePersonalize,
} from "./personalize.js";
import { avatarColor, initial } from "./util.js";

/** 訂閱本地個人化變更（頭像/背景），變更時觸發重繪（ADR-0077）。 */
export function usePersonalizeTick(): void {
  const [, setV] = useState(0);
  useEffect(() => subscribePersonalize(() => setV((v) => v + 1)), []);
}

/**
 * 頭像（ADR-0077／0154）：本地自訂圖 ＞ 對方廣播頭像 ＞ pubkey 漸層底＋名字首字。
 * 廣播頭像經 parse 側白名單（data:image/* 點陣圖）才會入庫，這裡直接當背景圖用。
 */
export function Avatar({
  id,
  name,
  size,
  className,
  ring,
  onClick,
  editable,
}: {
  id: string;
  name: string;
  size?: number | undefined;
  className?: string | undefined;
  ring?: string | undefined;
  onClick?: (() => void) | undefined;
  editable?: boolean | undefined;
}): JSX.Element {
  const { t } = useI18n();
  usePersonalizeTick();
  const custom = getAvatar(id) ?? getBroadcastAvatar(id);
  const cls = ["avatar", className, ring, editable ? "avatar--edit" : ""].filter(Boolean).join(" ");
  const style: CSSProperties = {};
  if (size) {
    style.width = size;
    style.height = size;
  }
  const common = onClick
    ? { className: cls, onClick, role: "button" as const, title: editable ? t("avatar_change") : undefined }
    : { className: cls };
  if (custom) {
    return (
      <div
        {...common}
        style={{ ...style, backgroundImage: `url("${custom}")`, backgroundSize: "cover", backgroundPosition: "center" }}
        aria-label={name}
      />
    );
  }
  return (
    <div {...common} style={{ ...style, background: avatarColor(id) }}>
      {initial(name)}
    </div>
  );
}

/**
 * 可編輯頭像（O2／ADR-0154）：點擊彈出「更換／從網址／移除」選單。換圖走本機縮圖 →
 * localStorage；帶 `onBroadcast` 的實例（自己的頭像）同時把縮圖交給引擎加密廣播給聯絡人
 * （選單標示「會同步給聯絡人」——ADR-0077 的本地頭像不會被靜默升級成廣播）。
 * 「從網址」由**本人裝置**抓圖轉縮圖（ADR-0154：URL 是輸入方式，不是傳輸方式）。
 */
export function EditableAvatar({
  id,
  name,
  size,
  ring,
  className,
  onBroadcast,
  initialMenu,
}: {
  id: string;
  name: string;
  size?: number;
  ring?: string;
  className?: string;
  /** 設定/移除時同步廣播（ADR-0154）；回 false＝引擎拒收（格式防線）。僅自己的頭像帶。 */
  onBroadcast?: (uri: string | undefined) => boolean;
  /** 測試用：初始展開選單（SSR 測試無法點擊頭像）。 */
  initialMenu?: boolean;
}): JSX.Element {
  const { t } = useI18n();
  const { alert, prompt } = useDialog();
  usePersonalizeTick();
  const [menu, setMenu] = useState(initialMenu ?? false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const hasCustom = !!getAvatar(id);
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent): void => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menu]);
  const apply = async (uri: string): Promise<void> => {
    if (!setAvatar(id, uri)) {
      await alert(t("personalize_quota"));
      return;
    }
    onBroadcast?.(uri);
  };
  const onFile = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const f = e.target.files?.[0];
    e.target.value = "";
    setMenu(false);
    if (!f) return;
    try {
      await apply(await downscaleImage(f, AVATAR_MAX_EDGE));
    } catch {
      /* 圖片解碼失敗略過 */
    }
  };
  const fromUrl = async (): Promise<void> => {
    setMenu(false);
    const url = (await prompt(t("avatar_urlPrompt")))?.trim();
    if (!url) return;
    try {
      // ADR-0154：由自己的裝置抓一次 → 縮圖 → 內嵌廣播。聯絡人永遠不接觸這個網址。
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      await apply(await downscaleImage(await res.blob(), AVATAR_MAX_EDGE));
    } catch {
      // CORS 拒絕、非圖片、斷網——都走同一條明確錯誤（已知限制，見 ADR-0154）
      await alert(t("avatar_urlError"));
    }
  };
  return (
    <div className="avatar-wrap" ref={wrapRef}>
      <Avatar id={id} name={name} size={size} ring={ring} className={className} editable onClick={() => setMenu((m) => !m)} />
      {menu ? (
        <div className="avatar-menu" role="menu">
          {onBroadcast ? <div className="avatar-menu__hint">{t("avatar_syncHint")}</div> : null}
          <button type="button" onClick={() => fileRef.current?.click()}>{t("avatar_change")}</button>
          <button type="button" data-testid="avatar-from-url" onClick={() => void fromUrl()}>{t("avatar_fromUrl")}</button>
          {hasCustom ? (
            <button
              type="button"
              onClick={() => {
                removeAvatar(id);
                onBroadcast?.(undefined);
                setMenu(false);
              }}
            >
              {t("avatar_remove")}
            </button>
          ) : null}
        </div>
      ) : null}
      <input ref={fileRef} type="file" accept="image/*" hidden data-testid="avatar-file" onChange={onFile} />
    </div>
  );
}

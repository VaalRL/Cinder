// 行動端頭像平台縫（ADR-0154）：選圖／抓網址 → 128px 縮圖 data URI，供加密廣播。
//
// 比照 files.ts——這是唯一碰平台 API 的地方。目前跑 react-native-web（DOM），
// 用 <input type="file"> 與 canvas；移植真 React Native 時換 expo-image-picker
// ＋ expo-image-manipulator，介面不變。

/** 頭像縮圖邊長上限（px）；與桌面 personalize.AVATAR_MAX_EDGE 同值（線上格式一致）。 */
export const AVATAR_MAX_EDGE = 128;

/** Blob → 等比縮到 128px 的 JPEG data URI；解碼失敗或無 DOM 回 null。 */
export async function downscaleAvatar(blob: Blob): Promise<string | null> {
  if (typeof document === "undefined" || typeof createImageBitmap === "undefined") return null;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    return null;
  }
  try {
    const scale = Math.min(1, AVATAR_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff"; // 透明底轉 JPEG 會變黑
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    bitmap.close();
  }
}

/** 讓使用者選一張圖並縮圖；取消或失敗回 null。 */
export async function pickAvatarImage(): Promise<string | null> {
  if (typeof document === "undefined") return null;
  const blob = await new Promise<Blob | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    input.onchange = () => {
      const f = input.files?.[0] ?? null;
      input.remove();
      resolve(f);
    };
    input.oncancel = () => {
      input.remove();
      resolve(null);
    };
    document.body.appendChild(input);
    input.click();
  });
  return blob ? await downscaleAvatar(blob) : null;
}

/**
 * 從網址抓圖並縮圖（ADR-0154：URL 是輸入方式——由**本人裝置**抓一次，
 * 聯絡人永遠只收內嵌密文縮圖，網址不外送）。CORS 拒絕、非圖片、斷網皆回 null。
 */
export async function avatarFromUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await downscaleAvatar(await res.blob());
  } catch {
    return null;
  }
}

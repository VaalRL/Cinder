// 統一版號同步（ADR-0227 P1）：以 root package.json 的 version 為單一真實來源（SSOT），
// 寫入各面向使用者 app 的版號欄位（desktop 三處＋mobile/cli/website）。
// `--check`：只比對、不寫入；不一致即以非零結束（供 CI 防漂移）。
// 以精準字串替換（非整檔重寫 JSON/TOML），保留各檔原格式。
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const p = (rel) => join(repoRoot, rel);

const version = JSON.parse(readFileSync(p("package.json"), "utf8")).version;
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`root package.json 的 version 非法：${JSON.stringify(version)}`);
  process.exit(1);
}

const check = process.argv.includes("--check");

// 每個目標：檔案相對路徑 ＋ 匹配 version 的 regex（群組 1＝含引號前綴、2＝舊值、3＝結尾引號）。
const targets = [
  ["apps/desktop/package.json", /("version":\s*")([^"]+)(")/],
  ["apps/desktop/src-tauri/tauri.conf.json", /("version":\s*")([^"]+)(")/],
  ["apps/desktop/src-tauri/Cargo.toml", /(^version\s*=\s*")([^"]+)(")/m],
  // Cargo.lock 內本 crate 自身的版號（緊接 name 下一行），同步以維持 `--locked` 建置一致。
  ["apps/desktop/src-tauri/Cargo.lock", /(name = "cinder-desktop"\r?\nversion = ")([^"]+)(")/],
  ["apps/mobile/package.json", /("version":\s*")([^"]+)(")/],
  ["apps/cli/package.json", /("version":\s*")([^"]+)(")/],
  ["apps/website/package.json", /("version":\s*")([^"]+)(")/],
];

let drift = false;
for (const [rel, re] of targets) {
  const file = p(rel);
  const text = readFileSync(file, "utf8");
  const m = text.match(re);
  if (!m) {
    console.error(`✗ ${rel}：找不到 version 欄位`);
    process.exit(1);
  }
  const current = m[2];
  if (current === version) continue;
  if (check) {
    console.error(`✗ ${rel}：${current} ≠ ${version}`);
    drift = true;
    continue;
  }
  writeFileSync(file, text.replace(re, `$1${version}$3`));
  console.log(`✓ ${rel}：${current} → ${version}`);
}

if (check) {
  if (drift) {
    console.error("\n版號不一致——請執行 `pnpm run version:sync`。");
    process.exit(1);
  }
  console.log(`版號一致：${version}`);
} else {
  console.log(`\n已同步至 ${version}（SSOT＝root package.json）。`);
}

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 行動端 web preview（ADR-0085）：以 react-native-web 在瀏覽器實跑 MobileApp（手機外框示範）。
// 同一份 vite 設定亦供 vitest 使用（test 區塊，環境 node）。
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});

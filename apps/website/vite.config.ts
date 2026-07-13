import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Cinder 官網（ADR-0090）：純靜態站，同一份設定供 vitest（環境 node）。
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});

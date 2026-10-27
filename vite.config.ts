import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// GitHub Pages では https://sugiyoshi-neo.github.io/it-study/ で公開する
export default defineConfig({
  base: "/it-study/",
  plugins: [react()],
  test: {
    environment: "node",
  },
});

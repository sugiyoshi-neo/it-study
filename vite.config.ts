import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// GitHub Pages では https://sugiyoshi-neo.github.io/it-study/ で公開する
export default defineConfig({
  base: "/it-study/",
  plugins: [react()],
  test: {
    environment: "node",
    // 教材パックを足したとき、古い読み込み結果(キャッシュ)でテストが通ってしまわないようにする
    fsModuleCache: false,
  },
});

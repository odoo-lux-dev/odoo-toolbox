import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";

export default defineConfig({
  plugins: [WxtVitest()],
  // Solid's default export condition under Node is its server build, which has no reactivity.
  resolve: { conditions: ["browser", "development"] },
  test: {
    environment: "happy-dom",
    pool: "vmThreads",
    environmentOptions: {
      happyDOM: {
        url: "http://localhost/",
        settings: {
          disableCSSFileLoading: true,
          disableJavaScriptFileLoading: true,
          handleDisabledFileLoadingAsSuccess: true,
        },
      },
    },
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
  },
});

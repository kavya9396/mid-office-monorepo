import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig({
  envDir: monorepoRoot,
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      reportsDirectory: path.resolve(monorepoRoot, "unit-test-reports/landing-coverage"),
      include: [
        "src/modules/inbox/InboxScreen.tsx",
        "src/modules/inbox/InboxSidebar.tsx",
        "src/modules/inbox/InboxTable.tsx",
        "src/modules/inbox/inboxApi.ts",
        "src/modules/inbox/inboxFormat.ts",
      ],
    },
  },
});

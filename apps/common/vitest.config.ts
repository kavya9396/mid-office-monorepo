import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig({
  envDir: monorepoRoot,
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
});

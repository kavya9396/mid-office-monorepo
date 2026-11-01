import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import {
  devConfig,
  monorepoRoot,
  serveInboxMock,
} from "../../scripts/dev-config.mjs";

const sharedPackages = [
  "@insurance-poc/common",
  "@insurance-poc/routes",
  "@insurance-poc/ui",
  "@insurance-poc/utils",
];

export default defineConfig({
  base: devConfig.viteBase.retail,
  clearScreen: false,
  envDir: monorepoRoot,
  plugins: [serveInboxMock("/api/inbox/retail", "apps/retail/src/modules/inbox/mock/retailInbox.json"), react()],
  optimizeDeps: {
    exclude: sharedPackages,
  },
  server: {
    host: devConfig.host,
    port: devConfig.ports.retail,
    strictPort: true,
    fs: {
      allow: [monorepoRoot],
    },
  },
});

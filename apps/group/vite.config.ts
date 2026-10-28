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
  base: devConfig.viteBase.group,
  clearScreen: false,
  envDir: monorepoRoot,
  plugins: [serveInboxMock("/api/inbox/group", "apps/group/src/modules/inbox/mock/groupInbox.json"), react()],
  optimizeDeps: {
    exclude: sharedPackages,
  },
  server: {
    host: devConfig.host,
    port: devConfig.ports.group,
    strictPort: true,
    fs: {
      allow: [monorepoRoot],
    },
  },
});

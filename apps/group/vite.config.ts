import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import {
  devConfig,
  gatewayOrigin,
  monorepoRoot,
} from "../../scripts/dev-config.mjs";

const sharedPackages = [
  "@insurance-poc/common",
  "@insurance-poc/routes",
  "@insurance-poc/ui",
  "@insurance-poc/util",
];

export default defineConfig({
  base: devConfig.viteBase.group,
  clearScreen: false,
  plugins: [react()],
  optimizeDeps: {
    exclude: sharedPackages,
  },
  server: {
    host: devConfig.host,
    port: devConfig.ports.group,
    strictPort: true,
    origin: gatewayOrigin(),
    fs: {
      allow: [monorepoRoot],
    },
  },
});

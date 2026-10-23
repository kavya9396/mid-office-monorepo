import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { devConfig, monorepoRoot } from "../../scripts/dev-config.mjs";

const sharedPackages = [
  "@insurance-poc/routes",
  "@insurance-poc/ui",
  "@insurance-poc/util",
];

function proxyPrefix(base: string): string {
  if (base !== "/" && base.endsWith("/")) return base.slice(0, -1);
  return base;
}

export default defineConfig({
  base: devConfig.viteBase.common,
  clearScreen: false,
  plugins: [react()],
  optimizeDeps: {
    exclude: sharedPackages,
  },
  server: {
    host: devConfig.host,
    port: devConfig.ports.common,
    strictPort: true,
    fs: {
      allow: [monorepoRoot],
    },
    proxy: {
      [proxyPrefix(devConfig.viteBase.retail)]: {
        target: `http://${devConfig.host}:${devConfig.ports.retail}`,
        changeOrigin: true,
        ws: true,
      },
      [proxyPrefix(devConfig.viteBase.group)]: {
        target: `http://${devConfig.host}:${devConfig.ports.group}`,
        changeOrigin: true,
        ws: true,
      },
    },
  },
});

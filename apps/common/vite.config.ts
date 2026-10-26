import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import {
  devConfig,
  monorepoRoot,
  proxyToDevApp,
  redirectBareAppRoots,
} from "../../scripts/dev-config.mjs";

const sharedPackages = [
  "@insurance-poc/routes",
  "@insurance-poc/ui",
  "@insurance-poc/utils",
];

function proxyPrefix(base: string): string {
  if (base !== "/" && base.endsWith("/")) return base.slice(0, -1);
  return base;
}

export default defineConfig({
  base: devConfig.viteBase.common,
  clearScreen: false,
  plugins: [redirectBareAppRoots(), react()],
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
      [proxyPrefix(devConfig.viteBase.retail)]: proxyToDevApp(devConfig.ports.retail),
      [proxyPrefix(devConfig.viteBase.group)]: proxyToDevApp(devConfig.ports.group),
    },
  },
});

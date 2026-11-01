import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export const devConfig = JSON.parse(
  fs.readFileSync(
    path.join(monorepoRoot, "packages/routes/src/dev-config.json"),
    "utf8",
  ),
);

export function gatewayOrigin() {
  return `http://${devConfig.host}:${devConfig.ports.common}`;
}

function hasHtmlAcceptHeader(accept) {
  if (Array.isArray(accept)) return accept.some((value) => value.includes("text/html"));
  return accept?.includes("text/html") ?? false;
}

/**
 * Canonicalize business-app roots before the gateway proxy hands the request
 * to Vite. Retail and Group are both built with a trailing-slash base URL.
 */
export function redirectBareAppRoots() {
  const appRoots = new Set([
    devConfig.viteBase.retail.slice(0, -1),
    devConfig.viteBase.group.slice(0, -1),
  ]);

  return {
    name: "redirect-bare-app-roots",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !hasHtmlAcceptHeader(req.headers.accept)) {
          next();
          return;
        }

        const url = new URL(req.url, gatewayOrigin());
        if (!appRoots.has(url.pathname)) {
          next();
          return;
        }

        res.writeHead(308, { Location: `${url.pathname}/${url.search}` });
        res.end();
      });
    },
  };
}

/**
 * Each business app registers only its own inbox mock. This keeps the mock
 * endpoint with the app that owns its payload and future API configuration.
 */
export function serveInboxMock(endpoint, fileName) {
  return {
    name: `serve-inbox-mock-${fileName}`,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0] ?? "";
        if (pathname !== endpoint) {
          next();
          return;
        }

        const filePath = path.join(monorepoRoot, fileName);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

export function proxyToDevApp(port) {
  return {
    target: `http://${devConfig.host}:${port}`,
    changeOrigin: true,
    ws: true,
    configure(proxy) {
      const markGatewayRequest = (proxyReq) => {
        proxyReq.setHeader("X-Dev-Gateway", "1");
      };
      proxy.on("proxyReq", markGatewayRequest);
      proxy.on("proxyReqWs", markGatewayRequest);
    },
  };
}

export { monorepoRoot };

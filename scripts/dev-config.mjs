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

function acceptHeader(accept) {
  if (Array.isArray(accept)) return accept.join(",");
  return accept ?? "";
}

/**
 * Browser visits to the retail or group dev port stay on that port, so /login
 * is outside the app base and sessionStorage is a different origin.
 * Send document navigations to the common server. Proxied requests are marked
 * and must pass through, otherwise /retail and /group would redirect forever.
 */
export function redirectDirectAccessToGateway() {
  const gateway = gatewayOrigin();

  return {
    name: "redirect-direct-access-to-gateway",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.headers["x-dev-gateway"] === "1") {
          next();
          return;
        }

        const isDocument =
          req.headers["sec-fetch-dest"] === "document" ||
          acceptHeader(req.headers.accept).includes("text/html");

        if (!isDocument || !req.url) {
          next();
          return;
        }

        const path = req.url.startsWith("/") ? req.url : `/${req.url}`;
        res.writeHead(302, { Location: `${gateway}${path}` });
        res.end();
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

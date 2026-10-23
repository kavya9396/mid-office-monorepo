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

export { monorepoRoot };

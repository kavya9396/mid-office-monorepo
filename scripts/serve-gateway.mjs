import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { devConfig, monorepoRoot } from "./dev-config.mjs";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

function mountPrefix(base) {
  if (!base || base === "/") return "";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

const mounts = [
  {
    name: "retail",
    prefix: mountPrefix(devConfig.viteBase.retail),
    dist: path.join(monorepoRoot, "apps/retail/dist"),
  },
  {
    name: "group",
    prefix: mountPrefix(devConfig.viteBase.group),
    dist: path.join(monorepoRoot, "apps/group/dist"),
  },
];

const commonDist = path.join(monorepoRoot, "apps/common/dist");

function assertBuild(name, dist) {
  if (!fs.existsSync(path.join(dist, "index.html"))) {
    console.error(`Missing ${name} build at ${dist}. Run pnpm build first.`);
    process.exit(1);
  }
}

assertBuild("common", commonDist);
for (const mount of mounts) {
  assertBuild(mount.name, mount.dist);
}

function resolveFile(dist, pathname) {
  let relative = "";
  try {
    relative = decodeURIComponent(pathname).replace(/^\/+/, "");
  } catch {
    return null;
  }

  const root = path.resolve(dist);
  if (relative) {
    const filePath = path.resolve(dist, relative);
    const inside = filePath === root || filePath.startsWith(`${root}${path.sep}`);
    if (inside && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }
    if (path.extname(relative)) return null;
  }

  return path.join(dist, "index.html");
}

function send(res, filePath) {
  if (!filePath) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const type = MIME[path.extname(filePath)] ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  if (!req.url || (req.method !== "GET" && req.method !== "HEAD")) {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method not allowed");
    return;
  }

  const pathname = new URL(req.url, `http://${devConfig.host}`).pathname;
  const mount = mounts.find(
    (item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`),
  );
  const filePath = mount
    ? resolveFile(mount.dist, pathname.slice(mount.prefix.length) || "/")
    : resolveFile(commonDist, pathname);

  if (req.method === "HEAD") {
    res.writeHead(filePath ? 200 : 404);
    res.end();
    return;
  }

  send(res, filePath);
});

server.listen(devConfig.previewPort, devConfig.host, () => {
  const origin = `http://${devConfig.host}:${devConfig.previewPort}`;
  console.log(`Same-origin preview at ${origin}`);
  console.log(`Common  ${origin}/login`);
  console.log(`Retail  ${origin}${mounts[0].prefix}/drs`);
  console.log(`Group   ${origin}${mounts[1].prefix}/drs`);
});

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { monorepoRoot } from "./dev-config.mjs";

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const applications = [
  { name: "Common", packageName: "@insurance-poc/common", directory: "common" },
  { name: "Retail", packageName: "@insurance-poc/retail", directory: "retail" },
  { name: "Group", packageName: "@insurance-poc/group", directory: "group" },
];

const results = [];

for (const application of applications) {
  console.log(`\n=== Building ${application.name} independently ===`);

  const result = spawnSync(
    pnpm,
    ["--filter", application.packageName, "build"],
    {
      cwd: monorepoRoot,
      env: process.env,
      stdio: "inherit",
    },
  );

  const artifact = path.join(
    monorepoRoot,
    "apps",
    application.directory,
    "dist",
    "index.html",
  );
  const passed = result.status === 0 && fs.existsSync(artifact);

  results.push({
    ...application,
    passed,
    exitCode: result.status,
    artifact,
  });
}

console.log("\n=== Independent deployment verification ===");
for (const result of results) {
  console.log(
    `${result.passed ? "PASS" : "FAIL"} ${result.name}: ${path.relative(monorepoRoot, result.artifact)}`,
  );
}

const failed = results.filter((result) => !result.passed);
if (failed.length > 0) {
  console.error(
    `\n${failed.length} application build failed. Other applications were still built and reported independently.`,
  );
  process.exitCode = 1;
} else {
  console.log(
    "\nAll applications produced separate deployment artifacts successfully.",
  );
}

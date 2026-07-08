import { fail, fileExists, readJson } from "./lib/repo.mjs";

const rootPackage = await readJson("package.json");

if (rootPackage.private !== true) {
  fail("Root package.json must remain private");
}

if (!rootPackage.workspaces?.includes("packages/*")) {
  fail("Root package.json must include packages/* workspaces");
}

if (rootPackage.engines?.node !== ">=22") {
  fail("Root package.json must require Node >=22");
}

const plannedPackages = [
  "packages/pdfium-node",
  "packages/pdfium-node-linux-x64-gnu",
  "packages/pdfium-node-darwin-arm64",
];

for (const directory of plannedPackages) {
  if (!(await fileExists(`${directory}/package.json`))) {
    fail(`Missing planned package manifest: ${directory}/package.json`);
  }
}

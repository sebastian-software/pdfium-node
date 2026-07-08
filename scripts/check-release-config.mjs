import { fail, fileExists, readJson } from "./lib/repo.mjs";

const requiredFiles = [
  "release-please-config.json",
  ".release-please-manifest.json",
  ".github/workflows/release-please.yml",
  ".github/workflows/publish.yml",
];

for (const file of requiredFiles) {
  if (!(await fileExists(file))) {
    fail(`Missing release file: ${file}`);
  }
}

const config = await readJson("release-please-config.json");
const manifest = await readJson(".release-please-manifest.json");
const packagePaths = [
  "packages/pdfium-node",
  "packages/pdfium-node-darwin-arm64",
  "packages/pdfium-node-linux-x64-gnu",
];

for (const path of packagePaths) {
  if (!config.packages?.[path]) {
    fail(`Release Please config missing package: ${path}`);
  }

  if (manifest[path] !== "0.0.0") {
    fail(`Release Please manifest must start ${path} at 0.0.0`);
  }
}

import { copyFile, mkdir, rm, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { root } from "./lib/repo.mjs";

const execFileAsync = promisify(execFile);

const nodeIncludeDirectory = process.config.variables.nodedir
  ? join(process.config.variables.nodedir, "include", "node")
  : join(dirname(process.execPath), "..", "include", "node");

const currentTarget = `${process.platform}-${process.arch}`;
const pdfiumRevision = "chromium/7934";
const pdfiumArchiveUrl =
  "https://github.com/bblanchon/pdfium-binaries/releases/download/chromium/7934/pdfium-mac-arm64.tgz";

if (currentTarget !== "darwin-arm64") {
  console.log(`No native PDFium build configured for ${currentTarget}; skipping.`);
  process.exit(0);
}

const packageDirectory = join(root, "packages/pdfium-node-darwin-arm64");
const outputDirectory = join(packageDirectory, "prebuilds/darwin-arm64");
const pdfiumDirectory = join(root, ".tmp/pdfium-binaries", pdfiumRevision.replace("/", "-"), "mac-arm64");
const pdfiumArchive = join(root, ".tmp/pdfium-binaries", "pdfium-mac-arm64.tgz");
const source = join(packageDirectory, "src/native.cc");
const output = join(outputDirectory, "pdfium_node_native.node");

await mkdir(outputDirectory, { recursive: true });
await ensurePdfium();

await copyFile(
  join(pdfiumDirectory, "lib/libpdfium.dylib"),
  join(outputDirectory, "libpdfium.dylib")
);
await copyFile(
  join(pdfiumDirectory, "VERSION"),
  join(outputDirectory, "PDFIUM_VERSION")
);

await rm(join(outputDirectory, "licenses"), { force: true, recursive: true });
await execFileAsync("cp", [
  "-R",
  join(pdfiumDirectory, "licenses"),
  join(outputDirectory, "licenses"),
]);

await execFileAsync("c++", [
  "-std=c++17",
  "-shared",
  "-undefined",
  "dynamic_lookup",
  "-I",
  nodeIncludeDirectory,
  "-I",
  join(pdfiumDirectory, "include"),
  "-L",
  outputDirectory,
  "-lpdfium",
  "-Wl,-rpath,@loader_path",
  source,
  "-o",
  output,
]);

await execFileAsync("install_name_tool", [
  "-change",
  "./libpdfium.dylib",
  "@loader_path/libpdfium.dylib",
  output,
]);

console.log(`Built ${output} with PDFium ${pdfiumRevision}`);

async function ensurePdfium() {
  if (await exists(join(pdfiumDirectory, "include/fpdfview.h"))) {
    return;
  }

  await mkdir(dirname(pdfiumArchive), { recursive: true });
  await mkdir(pdfiumDirectory, { recursive: true });

  if (!(await exists(pdfiumArchive))) {
    await execFileAsync("curl", ["-L", pdfiumArchiveUrl, "-o", pdfiumArchive]);
  }

  await execFileAsync("tar", ["-xzf", pdfiumArchive, "-C", pdfiumDirectory]);
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

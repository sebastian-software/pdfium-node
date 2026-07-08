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
const targets = {
  "darwin-arm64": {
    archiveName: "pdfium-mac-arm64.tgz",
    archiveUrl:
      "https://github.com/bblanchon/pdfium-binaries/releases/download/chromium/7934/pdfium-mac-arm64.tgz",
    packageName: "pdfium-node-darwin-arm64",
    prebuildName: "darwin-arm64",
    libraryName: "libpdfium.dylib",
    platform: "darwin",
    arch: "arm64",
    linkFlags: ["-undefined", "dynamic_lookup", "-Wl,-rpath,@loader_path"],
    postBuild: async ({ output }) => {
      await execFileAsync("install_name_tool", [
        "-change",
        "./libpdfium.dylib",
        "@loader_path/libpdfium.dylib",
        output,
      ]);
    },
  },
  "linux-x64": {
    archiveName: "pdfium-linux-x64.tgz",
    archiveUrl:
      "https://github.com/bblanchon/pdfium-binaries/releases/download/chromium/7934/pdfium-linux-x64.tgz",
    packageName: "pdfium-node-linux-x64-gnu",
    prebuildName: "linux-x64-gnu",
    libraryName: "libpdfium.so",
    platform: "linux",
    arch: "x64",
    linkFlags: ["-Wl,-rpath,$ORIGIN"],
    postBuild: async () => {},
  },
};

const target = targets[currentTarget];

if (!target) {
  console.log(`No native PDFium build configured for ${currentTarget}; skipping.`);
  process.exit(0);
}

const packageDirectory = join(root, "packages", target.packageName);
const outputDirectory = join(packageDirectory, "prebuilds", target.prebuildName);
const pdfiumDirectory = join(
  root,
  ".tmp/pdfium-binaries",
  pdfiumRevision.replace("/", "-"),
  target.prebuildName
);
const pdfiumArchive = join(root, ".tmp/pdfium-binaries", target.archiveName);
const source = join(root, "native/pdfium_node_native.cc");
const output = join(outputDirectory, "pdfium_node_native.node");

await mkdir(outputDirectory, { recursive: true });
await ensurePdfium();

await copyFile(
  join(pdfiumDirectory, "lib", target.libraryName),
  join(outputDirectory, target.libraryName)
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
  "-fPIC",
  ...target.linkFlags,
  "-I",
  nodeIncludeDirectory,
  "-I",
  join(pdfiumDirectory, "include"),
  `-DPDFIUM_NODE_PLATFORM="${target.platform}"`,
  `-DPDFIUM_NODE_ARCH="${target.arch}"`,
  `-DPDFIUM_NODE_REVISION="${pdfiumRevision}"`,
  source,
  "-L",
  outputDirectory,
  "-lpdfium",
  "-o",
  output,
]);

await target.postBuild({ output });

console.log(`Built ${output} with PDFium ${pdfiumRevision}`);

async function ensurePdfium() {
  if (await exists(join(pdfiumDirectory, "include/fpdfview.h"))) {
    return;
  }

  await mkdir(dirname(pdfiumArchive), { recursive: true });
  await mkdir(pdfiumDirectory, { recursive: true });

  if (!(await exists(pdfiumArchive))) {
    await execFileAsync("curl", ["-L", target.archiveUrl, "-o", pdfiumArchive]);
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

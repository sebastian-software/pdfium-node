import { mkdir, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { fail, root } from "./lib/repo.mjs";

const execFileAsync = promisify(execFile);
const tempDirectory = join(root, ".tmp");
const packDirectory = join(tempDirectory, "pack");
const npmCacheDirectory = join(tempDirectory, "npm-cache-pack");

const packages = [
  {
    workspace: "@sebastian-software/pdfium-node",
    requiredFiles: [
      "src/index.js",
      "src/index.d.ts",
      "README.md",
      "LICENSE",
      "package.json",
    ],
  },
  {
    workspace: "@sebastian-software/pdfium-node-darwin-arm64",
    requiredFiles: [
      "index.js",
      "README.md",
      "LICENSE",
      "THIRD_PARTY_NOTICES.md",
      "package.json",
    ],
    platformRequiredFiles:
      process.platform === "darwin" && process.arch === "arm64"
        ? ["prebuilds/darwin-arm64/pdfium_node_native.node"]
          .concat([
            "prebuilds/darwin-arm64/libpdfium.dylib",
            "prebuilds/darwin-arm64/PDFIUM_VERSION",
            "prebuilds/darwin-arm64/licenses/pdfium.txt",
          ])
        : [],
  },
  {
    workspace: "@sebastian-software/pdfium-node-linux-x64-gnu",
    requiredFiles: [
      "index.js",
      "README.md",
      "LICENSE",
      "THIRD_PARTY_NOTICES.md",
      "package.json",
    ],
    platformRequiredFiles:
      process.platform === "linux" && process.arch === "x64"
        ? [
            "prebuilds/linux-x64-gnu/pdfium_node_native.node",
            "prebuilds/linux-x64-gnu/libpdfium.so",
            "prebuilds/linux-x64-gnu/PDFIUM_VERSION",
            "prebuilds/linux-x64-gnu/licenses/pdfium.txt",
          ]
        : [],
  },
];

await rm(packDirectory, { force: true, recursive: true });
await mkdir(packDirectory, { recursive: true });
await mkdir(npmCacheDirectory, { recursive: true });

try {
  for (const packageSpec of packages) {
    const { stdout } = await execFileAsync(
      "npm",
      [
        "pack",
        "--workspace",
        packageSpec.workspace,
        "--json",
        "--pack-destination",
        packDirectory,
      ],
      {
        env: {
          ...process.env,
          npm_config_cache: npmCacheDirectory,
        },
      }
    );

    const [packResult] = JSON.parse(stdout);
    const packedFiles = new Set(packResult.files.map((file) => file.path));

    for (const file of [
      ...packageSpec.requiredFiles,
      ...(packageSpec.platformRequiredFiles ?? []),
    ]) {
      if (!packedFiles.has(file)) {
        fail(`${packageSpec.workspace} package is missing ${file}`);
      }
    }
  }
} finally {
  await rm(packDirectory, { force: true, recursive: true });
  await rm(npmCacheDirectory, { force: true, recursive: true });
}

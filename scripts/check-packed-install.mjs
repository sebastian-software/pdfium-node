import { mkdir, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { root } from "./lib/repo.mjs";

const execFileAsync = promisify(execFile);
const tempDirectory = join(tmpdir(), `pdfium-node-install-smoke-${process.pid}`);
const packDirectory = join(tempDirectory, "pack");
const projectDirectory = join(tempDirectory, "project");
const npmCacheDirectory = join(tempDirectory, "npm-cache");

const workspacePackages = [
  "pdfium-node",
  "pdfium-node-darwin-arm64",
  "pdfium-node-linux-x64-gnu",
];

await rm(tempDirectory, { force: true, recursive: true });
await mkdir(packDirectory, { recursive: true });
await mkdir(projectDirectory, { recursive: true });
await mkdir(npmCacheDirectory, { recursive: true });

try {
  const tarballs = [];

  for (const workspace of workspacePackages) {
    const { stdout } = await npm([
      "pack",
      "--workspace",
      workspace,
      "--json",
      "--pack-destination",
      packDirectory,
    ]);

    const [packResult] = JSON.parse(stdout);
    tarballs.push(join(packDirectory, packResult.filename));
  }

  await writeFile(
    join(projectDirectory, "package.json"),
    JSON.stringify(
      {
        private: true,
        type: "module",
      },
      null,
      2
    ) + "\n"
  );

  await npm(["install", "--ignore-scripts", ...tarballs], projectDirectory);

  await execFileAsync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `
        import {
          ErrorCodes,
          PdfiumNodeError,
          getPdfiumNodeBuildInfo,
          renderPdfThumbnails,
        } from "pdfium-node";
        import { pathToFileURL } from "node:url";

        const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
        const expectedPlatformPackage =
          process.platform === "darwin" && process.arch === "arm64"
            ? "pdfium-node-darwin-arm64"
            : process.platform === "linux" && process.arch === "x64"
              ? "pdfium-node-linux-x64-gnu"
              : null;

        if (!expectedPlatformPackage) throw new Error("Unsupported smoke platform");

        const buildInfo = await getPdfiumNodeBuildInfo();
        if (buildInfo.packageName !== "pdfium-node") throw new Error("Unexpected package name");
        if (typeof buildInfo.packageVersion !== "string") throw new Error("Missing package version");
        if (buildInfo.platformPackageName !== expectedPlatformPackage) {
          throw new Error("Unexpected platform package");
        }
        if (buildInfo.platformPackageVersion !== buildInfo.packageVersion) {
          throw new Error("Unexpected platform package version");
        }
        if (buildInfo.platform !== process.platform) throw new Error("Unexpected platform");
        if (buildInfo.arch !== process.arch) throw new Error("Unexpected arch");
        if (buildInfo.pdfiumVersion !== "chromium/7934") {
          throw new Error("Unexpected PDFium version");
        }
        if (buildInfo.pdfiumRevision !== "chromium/7934") {
          throw new Error("Unexpected PDFium revision");
        }

        try {
          await renderPdfThumbnails(pdf, { pages: [1] });
          throw new Error("Expected native placeholder to fail");
        } catch (error) {
          if (!(error instanceof PdfiumNodeError)) throw error;
          if (error.code !== ErrorCodes.MalformedPdf) throw error;
        }

        const platformModuleUrl = pathToFileURL(
          "node_modules/pdfium-node/src/platform.js"
        );
        const { loadNativePackage } = await import(platformModuleUrl);

        try {
          await loadNativePackage("win32", "x64");
          throw new Error("Expected unsupported platform to fail");
        } catch (error) {
          if (!(error instanceof PdfiumNodeError)) throw error;
          if (error.code !== ErrorCodes.UnsupportedPlatform) throw error;
          if (!error.message.includes("win32/x64")) throw error;
          if (error.metadata?.platform !== "win32") throw error;
          if (error.metadata?.arch !== "x64") throw error;
        }
      `,
    ],
    { cwd: projectDirectory }
  );
} finally {
  await rm(tempDirectory, { force: true, recursive: true });
}

function npm(args, cwd = root) {
  return execFileAsync("npm", args, {
    cwd,
    env: {
      ...process.env,
      npm_config_cache: npmCacheDirectory,
    },
  });
}

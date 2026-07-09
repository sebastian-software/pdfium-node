import { createRequire } from "node:module";
import { ErrorCodes, PdfiumNodeError } from "./errors.js";
import { normalizeRenderOptions } from "./options.js";
import { getPlatformPackageName, loadNativePackage } from "./platform.js";
import { renderInWorker } from "./worker.js";

export { ErrorCodes, PdfiumNodeError } from "./errors.js";

const require = createRequire(import.meta.url);
const packageMetadata = require("../package.json");

export async function renderPdfThumbnails(pdf, options) {
  const normalized = normalizeRenderOptions(pdf, options);
  return renderInWorker(pdf, normalized);
}

export async function getPdfiumNodeBuildInfo() {
  const platform = process.platform;
  const arch = process.arch;
  const platformPackageName = getPlatformPackageName(platform, arch);
  const nativePackage = await loadNativePackage(platform, arch);

  if (typeof nativePackage.getNativeBuildInfo !== "function") {
    throw new PdfiumNodeError(
      ErrorCodes.PdfiumError,
      "Native package does not expose getNativeBuildInfo."
    );
  }

  const native = nativePackage.getNativeBuildInfo();
  const pdfiumRevision = typeof native.pdfiumRevision === "string"
    ? native.pdfiumRevision
    : undefined;

  return {
    packageName: packageMetadata.name,
    packageVersion: packageMetadata.version,
    platformPackageName,
    platformPackageVersion: getPackageVersion(platformPackageName),
    platform,
    arch,
    pdfiumVersion: pdfiumRevision,
    pdfiumRevision,
    native,
  };
}

function getPackageVersion(packageName) {
  try {
    return require(`${packageName}/package.json`).version;
  } catch {
    return undefined;
  }
}

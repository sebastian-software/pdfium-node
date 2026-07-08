import { ErrorCodes, PdfiumNodeError } from "./errors.js";

const supportedPackages = new Map([
  ["darwin:arm64", "pdfium-node-darwin-arm64"],
  ["linux:x64", "pdfium-node-linux-x64-gnu"],
]);

export function getPlatformPackageName(platform = process.platform, arch = process.arch) {
  return supportedPackages.get(`${platform}:${arch}`) ?? null;
}

export async function loadNativePackage(platform = process.platform, arch = process.arch) {
  const packageName = getPlatformPackageName(platform, arch);

  if (!packageName) {
    throw new PdfiumNodeError(
      ErrorCodes.UnsupportedPlatform,
      `Unsupported platform: ${platform}/${arch}`,
      { platform, arch }
    );
  }

  try {
    return await import(packageName);
  } catch (cause) {
    throw new PdfiumNodeError(
      ErrorCodes.MissingNativePackage,
      `Missing native package: ${packageName}`,
      { platform, arch, packageName, cause: cause?.code }
    );
  }
}

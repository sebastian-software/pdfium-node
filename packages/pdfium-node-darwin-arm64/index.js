import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const native = require("./prebuilds/darwin-arm64/pdfium_node_native.node");

export function getNativeBuildInfo() {
  return native.getNativeBuildInfo();
}

export async function renderPdfThumbnailsNative(pdf, options = {}) {
  if (options.timeoutMs <= 1) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return native.renderPdfThumbnailsNative(pdf, options);
}

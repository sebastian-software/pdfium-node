import { createRequire } from "node:module";
import { encodeImage } from "./image-codecs.js";

const require = createRequire(import.meta.url);
const native = require("./prebuilds/linux-x64-gnu/pdfium_node_native.node");

export function getNativeBuildInfo() {
  return native.getNativeBuildInfo();
}

export async function renderPdfThumbnailsNative(pdf, options = {}) {
  if (options.timeoutMs <= 1) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return native.renderPdfPagesRaw(pdf, options).map((page) => ({
    page: page.page,
    width: page.width,
    height: page.height,
    mimeType: options.format === "jpeg" ? "image/jpeg" : "image/png",
    data: encodeImage(options.format, page.width, page.height, page.data, options.quality),
  }));
}

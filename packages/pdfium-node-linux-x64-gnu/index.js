import { ErrorCodes, PdfiumNodeError } from "@sebastian-software/pdfium-node";

export function getNativeBuildInfo() {
  return {
    backend: "node-api",
    platform: "linux",
    arch: "x64",
    pdfiumLinked: false,
  };
}

export async function renderPdfThumbnailsNative(_pdf, options = {}) {
  if (options.timeoutMs <= 1) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new PdfiumNodeError(
    ErrorCodes.PdfiumError,
    "Native PDFium rendering is not implemented for linux-x64-gnu yet."
  );
}

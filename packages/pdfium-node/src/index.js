import { ErrorCodes, PdfiumNodeError } from "./errors.js";
import { loadNativePackage } from "./platform.js";
import { normalizeRenderOptions } from "./options.js";

export { ErrorCodes, PdfiumNodeError } from "./errors.js";

export async function renderPdfThumbnails(pdf, options) {
  const normalized = normalizeRenderOptions(pdf, options);
  const nativePackage = await loadNativePackage();

  if (typeof nativePackage.renderPdfThumbnailsNative !== "function") {
    throw new PdfiumNodeError(
      ErrorCodes.PdfiumError,
      "Native package does not expose renderPdfThumbnailsNative."
    );
  }

  return nativePackage.renderPdfThumbnailsNative(pdf, normalized);
}

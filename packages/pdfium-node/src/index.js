import { ErrorCodes, PdfiumNodeError } from "./errors.js";
import { normalizeRenderOptions } from "./options.js";
import { renderInWorker } from "./worker.js";

export { ErrorCodes, PdfiumNodeError } from "./errors.js";

export async function renderPdfThumbnails(pdf, options) {
  const normalized = normalizeRenderOptions(pdf, options);
  return renderInWorker(pdf, normalized);
}

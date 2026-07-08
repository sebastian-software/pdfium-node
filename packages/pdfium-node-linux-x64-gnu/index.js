import { ErrorCodes, PdfiumNodeError } from "@sebastian-software/pdfium-node";

export async function renderPdfThumbnailsNative() {
  throw new PdfiumNodeError(
    ErrorCodes.PdfiumError,
    "Native PDFium rendering is not implemented for linux-x64-gnu yet."
  );
}

export const ErrorCodes = Object.freeze({
  UnsupportedPlatform: "PDFIUM_NODE_UNSUPPORTED_PLATFORM",
  MissingNativePackage: "PDFIUM_NODE_MISSING_NATIVE_PACKAGE",
  InvalidOptions: "PDFIUM_NODE_INVALID_OPTIONS",
  InvalidPage: "PDFIUM_NODE_INVALID_PAGE",
  MalformedPdf: "PDFIUM_NODE_MALFORMED_PDF",
  EncryptedPdf: "PDFIUM_NODE_ENCRYPTED_PDF",
  PasswordRequired: "PDFIUM_NODE_PASSWORD_REQUIRED",
  IncorrectPassword: "PDFIUM_NODE_INCORRECT_PASSWORD",
  RenderTimeout: "PDFIUM_NODE_RENDER_TIMEOUT",
  PixelLimitExceeded: "PDFIUM_NODE_PIXEL_LIMIT_EXCEEDED",
  PdfiumError: "PDFIUM_NODE_PDFIUM_ERROR",
  WorkerCrashed: "PDFIUM_NODE_WORKER_CRASHED",
});

export class PdfiumNodeError extends Error {
  constructor(code, message, metadata = {}) {
    super(message);
    this.name = "PdfiumNodeError";
    this.code = code;
    this.metadata = metadata;
  }
}

export function invalidOptions(message, metadata = {}) {
  return new PdfiumNodeError(ErrorCodes.InvalidOptions, message, metadata);
}

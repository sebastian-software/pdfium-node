export type PdfImageFormat = "jpeg" | "png";

export type PdfThumbnailBackground = "white";

export interface RenderPdfThumbnailsOptions {
  pages: number[];
  maxWidth?: number;
  scale?: number;
  format?: PdfImageFormat;
  quality?: number;
  timeoutMs?: number;
  maxPixels?: number;
  maxInputBytes?: number;
  background?: PdfThumbnailBackground;
}

export interface RenderedPdfThumbnail {
  page: number;
  width: number;
  height: number;
  mimeType: "image/jpeg" | "image/png";
  data: Uint8Array;
}

export declare const ErrorCodes: Readonly<{
  UnsupportedPlatform: "PDFIUM_NODE_UNSUPPORTED_PLATFORM";
  MissingNativePackage: "PDFIUM_NODE_MISSING_NATIVE_PACKAGE";
  InvalidOptions: "PDFIUM_NODE_INVALID_OPTIONS";
  InvalidPage: "PDFIUM_NODE_INVALID_PAGE";
  MalformedPdf: "PDFIUM_NODE_MALFORMED_PDF";
  EncryptedPdf: "PDFIUM_NODE_ENCRYPTED_PDF";
  PasswordRequired: "PDFIUM_NODE_PASSWORD_REQUIRED";
  IncorrectPassword: "PDFIUM_NODE_INCORRECT_PASSWORD";
  RenderTimeout: "PDFIUM_NODE_RENDER_TIMEOUT";
  PixelLimitExceeded: "PDFIUM_NODE_PIXEL_LIMIT_EXCEEDED";
  PdfiumError: "PDFIUM_NODE_PDFIUM_ERROR";
  WorkerCrashed: "PDFIUM_NODE_WORKER_CRASHED";
}>;

export declare class PdfiumNodeError extends Error {
  readonly code: (typeof ErrorCodes)[keyof typeof ErrorCodes];
  readonly metadata: Record<string, unknown>;
}

export declare function renderPdfThumbnails(
  pdf: Uint8Array | Buffer,
  options: RenderPdfThumbnailsOptions
): Promise<RenderedPdfThumbnail[]>;

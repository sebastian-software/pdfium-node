import { ErrorCodes, PdfiumNodeError } from "./errors.js";
import { loadNativePackage } from "./platform.js";

process.on("message", async (message) => {
  if (message?.type !== "render") {
    return;
  }

  try {
    const nativePackage = await loadNativePackage();

    if (typeof nativePackage.renderPdfThumbnailsNative !== "function") {
      throw new PdfiumNodeError(
        ErrorCodes.PdfiumError,
        "Native package does not expose renderPdfThumbnailsNative."
      );
    }

    const result = await nativePackage.renderPdfThumbnailsNative(
      message.pdf,
      message.options
    );

    sendAndExit({
      type: "success",
      result,
    });
  } catch (error) {
    sendAndExit({
      type: "error",
      error: serializeError(error),
    });
  }
});

function serializeError(error) {
  if (error instanceof PdfiumNodeError) {
    return {
      code: error.code,
      message: error.message,
      metadata: error.metadata,
    };
  }

  if (
    error instanceof Error &&
    typeof error.code === "string" &&
    error.code.startsWith("PDFIUM_NODE_")
  ) {
    return {
      code: error.code,
      message: error.message,
      metadata: {},
    };
  }

  return {
    code: ErrorCodes.PdfiumError,
    message: error instanceof Error ? error.message : "Unknown native render error.",
    metadata: {},
  };
}

function sendAndExit(message) {
  if (!process.send) {
    process.exit(0);
    return;
  }

  process.send(message, () => {
    process.exit(0);
  });
}

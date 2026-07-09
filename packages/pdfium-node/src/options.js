import { invalidOptions, ErrorCodes, PdfiumNodeError } from "./errors.js";

const supportedFormats = new Set(["jpeg", "png"]);

export function normalizeRenderOptions(pdf, options) {
  if (!(pdf instanceof Uint8Array)) {
    throw invalidOptions("PDF input must be a Uint8Array or Buffer.");
  }

  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw invalidOptions("Render options must be an object.");
  }

  const pages = validatePages(options.pages);
  const format = validateFormat(options.format ?? "jpeg");
  const maxWidth = validateOptionalPositiveInteger(options.maxWidth, "maxWidth") ?? 1000;
  const scale = validateOptionalPositiveNumber(options.scale, "scale");
  const quality = validateOptionalIntegerRange(options.quality, "quality", 1, 100) ?? 72;
  const timeoutMs = validateOptionalPositiveInteger(options.timeoutMs, "timeoutMs") ?? 5000;
  const maxPixels = validateOptionalPositiveInteger(options.maxPixels, "maxPixels") ?? 4_000_000;
  const maxInputBytes = validateOptionalPositiveInteger(options.maxInputBytes, "maxInputBytes");
  const background = options.background ?? "white";

  if (scale !== undefined && options.maxWidth !== undefined) {
    throw invalidOptions("Use either maxWidth or scale, not both.", {
      options: ["maxWidth", "scale"],
    });
  }

  if (background !== "white") {
    throw invalidOptions("Only a white background is supported in the MVP.", {
      background,
    });
  }

  if (options.password !== undefined) {
    throw new PdfiumNodeError(
      ErrorCodes.PasswordRequired,
      "Password-protected PDFs are not supported by the stable API."
    );
  }

  if (maxInputBytes !== undefined && pdf.byteLength > maxInputBytes) {
    throw invalidOptions("PDF input exceeds maxInputBytes.", {
      maxInputBytes,
      byteLength: pdf.byteLength,
    });
  }

  return {
    pages,
    maxWidth,
    scale,
    format,
    quality,
    timeoutMs,
    maxPixels,
    maxInputBytes,
    background,
  };
}

function validatePages(pages) {
  if (!Array.isArray(pages) || pages.length === 0) {
    throw invalidOptions("pages must be a non-empty array of 1-based page numbers.");
  }

  return pages.map((page, index) => {
    if (!Number.isInteger(page) || page < 1) {
      throw new PdfiumNodeError(
        ErrorCodes.InvalidPage,
        "pages must contain positive 1-based page numbers.",
        { index, page }
      );
    }

    return page;
  });
}

function validateFormat(format) {
  if (!supportedFormats.has(format)) {
    throw invalidOptions("format must be either jpeg or png.", { format });
  }

  return format;
}

function validateOptionalPositiveInteger(value, name) {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isInteger(value) || value <= 0) {
    throw invalidOptions(`${name} must be a positive integer.`, { [name]: value });
  }

  return value;
}

function validateOptionalPositiveNumber(value, name) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw invalidOptions(`${name} must be a positive number.`, { [name]: value });
  }

  return value;
}

function validateOptionalIntegerRange(value, name, min, max) {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isInteger(value) || value < min || value > max) {
    throw invalidOptions(`${name} must be an integer from ${min} to ${max}.`, {
      [name]: value,
      min,
      max,
    });
  }

  return value;
}

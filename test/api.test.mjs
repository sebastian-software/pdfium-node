import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as pdfiumNode from "pdfium-node";
import {
  ErrorCodes,
  PdfiumNodeError,
  renderPdfThumbnails,
} from "pdfium-node";
import { getPlatformPackageName } from "../packages/pdfium-node/src/platform.js";
import { renderInWorker } from "../packages/pdfium-node/src/worker.js";

const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
const jpegStart = [255, 216];
const jpegEnd = [255, 217];

describe("public API surface", () => {
  it("exports the stable MVP symbols", () => {
    assert.deepEqual(Object.keys(pdfiumNode).sort(), [
      "ErrorCodes",
      "PdfiumNodeError",
      "renderPdfThumbnails",
    ]);
  });

  it("keeps stable error code strings", () => {
    assert.deepEqual(ErrorCodes, {
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
  });
});

describe("renderPdfThumbnails", () => {
  it("rejects missing page requests", async () => {
    await assert.rejects(
      () => renderPdfThumbnails(pdfBytes, {}),
      (error) =>
        error instanceof PdfiumNodeError &&
        error.code === ErrorCodes.InvalidOptions
    );
  });

  it("rejects invalid page numbers", async () => {
    await assert.rejects(
      () => renderPdfThumbnails(pdfBytes, { pages: [0] }),
      (error) =>
        error instanceof PdfiumNodeError &&
        error.code === ErrorCodes.InvalidPage
    );
  });

  it("rejects conflicting size controls", async () => {
    await assert.rejects(
      () => renderPdfThumbnails(pdfBytes, { pages: [1], maxWidth: 100, scale: 2 }),
      (error) =>
        error instanceof PdfiumNodeError &&
        error.code === ErrorCodes.InvalidOptions
    );
  });

  it("rejects transparent backgrounds in the MVP", async () => {
    await assert.rejects(
      () => renderPdfThumbnails(pdfBytes, { pages: [1], background: "transparent" }),
      (error) =>
        error instanceof PdfiumNodeError &&
        error.code === ErrorCodes.InvalidOptions
    );
  });

  it("rejects password input in the stable API", async () => {
    await assert.rejects(
      () => renderPdfThumbnails(pdfBytes, { pages: [1], password: "secret" }),
      (error) =>
        error instanceof PdfiumNodeError &&
        error.code === ErrorCodes.PasswordRequired
    );
  });

  it("returns a typed error for incomplete PDF input", async () => {
    await assert.rejects(
      () => renderPdfThumbnails(pdfBytes, { pages: [1] }),
      (error) =>
        error instanceof PdfiumNodeError &&
        error.code === ErrorCodes.MalformedPdf
    );
  });

  it("enforces render timeouts in the worker path", async () => {
    await assert.rejects(
      () => renderPdfThumbnails(pdfBytes, { pages: [1], timeoutMs: 1 }),
      (error) =>
        error instanceof PdfiumNodeError &&
        error.code === ErrorCodes.RenderTimeout
    );
  });

  it("does not leave timed-out worker processes alive", async () => {
    let workerPid;

    await assert.rejects(
      () =>
        renderInWorker(
          pdfBytes,
          { pages: [1], timeoutMs: 20 },
          {
            workerPath: new URL("../fixtures/hang-worker.js", import.meta.url),
            onSpawn: (child) => {
              workerPid = child.pid;
            },
          }
        ),
      (error) =>
        error instanceof PdfiumNodeError &&
        error.code === ErrorCodes.RenderTimeout
    );

    assert.equal(isProcessRunning(workerPid), false);
  });

  it("returns a typed error when the worker exits early", async () => {
    await assert.rejects(
      () =>
        renderInWorker(
          pdfBytes,
          { pages: [1], timeoutMs: 5000 },
          { workerPath: new URL("../fixtures/crash-worker.js", import.meta.url) }
        ),
      (error) =>
        error instanceof PdfiumNodeError &&
        error.code === ErrorCodes.WorkerCrashed
    );
  });

  it("renders a simple vector PDF page to PNG", async () => {
    const fixture = await readFile("fixtures/simple-one-page.pdf");
    const [thumbnail] = await renderPdfThumbnails(fixture, {
      pages: [1],
      format: "png",
      maxWidth: 200,
    });

    assert.equal(thumbnail.page, 1);
    assert.equal(thumbnail.width, 200);
    assert.equal(thumbnail.height, 200);
    assert.equal(thumbnail.mimeType, "image/png");
    assert.deepEqual(Array.from(thumbnail.data.slice(0, 8)), pngSignature);
    assert.ok(thumbnail.data.byteLength > 100);
  });

  it("preserves requested order and duplicate pages", async () => {
    const fixture = await readFile("fixtures/multi-page.pdf");
    const thumbnails = await renderPdfThumbnails(fixture, {
      pages: [2, 1, 2],
      format: "png",
      maxWidth: 100,
    });

    assert.deepEqual(
      thumbnails.map((thumbnail) => thumbnail.page),
      [2, 1, 2]
    );
    assert.equal(thumbnails.length, 3);
  });

  it("renders an image-heavy PDF page to PNG", async () => {
    const fixture = await readFile("fixtures/image-heavy.pdf");
    const [thumbnail] = await renderPdfThumbnails(fixture, {
      pages: [1],
      format: "png",
      maxWidth: 160,
    });

    assert.equal(thumbnail.page, 1);
    assert.equal(thumbnail.width, 160);
    assert.equal(thumbnail.height, 160);
    assert.equal(thumbnail.mimeType, "image/png");
    assert.deepEqual(Array.from(thumbnail.data.slice(0, 8)), pngSignature);
  });

  it("returns a typed error for malformed PDFs", async () => {
    await assert.rejects(
      () => renderPdfThumbnails(pdfBytes, { pages: [1], format: "png" }),
      (error) =>
        error instanceof PdfiumNodeError &&
        error.code === ErrorCodes.MalformedPdf
    );
  });

  it("enforces maxPixels before returning image bytes", async () => {
    const fixture = await readFile("fixtures/simple-one-page.pdf");

    await assert.rejects(
      () =>
        renderPdfThumbnails(fixture, {
          pages: [1],
          format: "png",
          maxWidth: 200,
          maxPixels: 100,
        }),
      (error) =>
        error instanceof PdfiumNodeError &&
        error.code === ErrorCodes.PixelLimitExceeded
    );
  });

  it("returns a typed error for encrypted PDFs without password support", async () => {
    const fixture = await readFile("fixtures/encrypted.pdf");

    await assert.rejects(
      () => renderPdfThumbnails(fixture, { pages: [1], format: "png" }),
      (error) =>
        error instanceof PdfiumNodeError &&
        (error.code === ErrorCodes.PasswordRequired ||
          error.code === ErrorCodes.EncryptedPdf)
    );
  });

  it("renders JPEG output with explicit quality", async () => {
    const fixture = await readFile("fixtures/simple-one-page.pdf");

    const [thumbnail] = await renderPdfThumbnails(fixture, {
      pages: [1],
      format: "jpeg",
      quality: 80,
      maxWidth: 120,
    });

    assert.equal(thumbnail.page, 1);
    assert.equal(thumbnail.width, 120);
    assert.equal(thumbnail.height, 120);
    assert.equal(thumbnail.mimeType, "image/jpeg");
    assert.deepEqual(Array.from(thumbnail.data.slice(0, 2)), jpegStart);
    assert.deepEqual(Array.from(thumbnail.data.slice(-2)), jpegEnd);
    assert.deepEqual(readJpegDimensions(thumbnail.data), { width: 120, height: 120 });
    assert.ok(thumbnail.data.byteLength > 100);
  });

  it("rejects invalid JPEG quality values", async () => {
    await assert.rejects(
      () => renderPdfThumbnails(pdfBytes, { pages: [1], format: "jpeg", quality: 0 }),
      (error) =>
        error instanceof PdfiumNodeError &&
        error.code === ErrorCodes.InvalidOptions
    );
  });

  it("handles repeated render calls", async () => {
    const fixture = await readFile("fixtures/simple-one-page.pdf");

    for (let index = 0; index < 3; index += 1) {
      const [thumbnail] = await renderPdfThumbnails(fixture, {
        pages: [1],
        format: "png",
        maxWidth: 80,
      });

      assert.equal(thumbnail.width, 80);
      assert.equal(thumbnail.mimeType, "image/png");
    }
  });
});

function isProcessRunning(pid) {
  assert.equal(typeof pid, "number");

  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === "ESRCH") {
      return false;
    }

    throw error;
  }
}

function readJpegDimensions(bytes) {
  let offset = 2;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      throw new Error("Invalid JPEG marker");
    }

    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];

    if (marker === 0xc0) {
      return {
        height: (bytes[offset + 5] << 8) | bytes[offset + 6],
        width: (bytes[offset + 7] << 8) | bytes[offset + 8],
      };
    }

    offset += 2 + length;
  }

  throw new Error("JPEG SOF0 marker not found");
}

describe("platform package resolution", () => {
  it("maps macOS arm64", () => {
    assert.equal(
      getPlatformPackageName("darwin", "arm64"),
      "pdfium-node-darwin-arm64"
    );
  });

  it("maps Linux x64 glibc", () => {
    assert.equal(
      getPlatformPackageName("linux", "x64"),
      "pdfium-node-linux-x64-gnu"
    );
  });

  it("does not claim Windows support", () => {
    assert.equal(getPlatformPackageName("win32", "x64"), null);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ErrorCodes,
  PdfiumNodeError,
  renderPdfThumbnails,
} from "@sebastian-software/pdfium-node";
import { getPlatformPackageName } from "../packages/pdfium-node/src/platform.js";
import { renderInWorker } from "../packages/pdfium-node/src/worker.js";

const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

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

  it("rejects password input in the MVP", async () => {
    await assert.rejects(
      () => renderPdfThumbnails(pdfBytes, { pages: [1], password: "secret" }),
      (error) =>
        error instanceof PdfiumNodeError &&
        error.code === ErrorCodes.PasswordRequired
    );
  });

  it("reaches the native placeholder on supported development platforms", async () => {
    await assert.rejects(
      () => renderPdfThumbnails(pdfBytes, { pages: [1] }),
      (error) =>
        error instanceof PdfiumNodeError &&
        error.code === ErrorCodes.PdfiumError
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

  it("returns a typed error for JPEG output until the encoder lands", async () => {
    const fixture = await readFile("fixtures/simple-one-page.pdf");

    await assert.rejects(
      () =>
        renderPdfThumbnails(fixture, {
          pages: [1],
          format: "jpeg",
        }),
      (error) =>
        error instanceof PdfiumNodeError &&
        error.code === ErrorCodes.PdfiumError
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

describe("platform package resolution", () => {
  it("maps macOS arm64", () => {
    assert.equal(
      getPlatformPackageName("darwin", "arm64"),
      "@sebastian-software/pdfium-node-darwin-arm64"
    );
  });

  it("maps Linux x64 glibc", () => {
    assert.equal(
      getPlatformPackageName("linux", "x64"),
      "@sebastian-software/pdfium-node-linux-x64-gnu"
    );
  });

  it("does not claim Windows support", () => {
    assert.equal(getPlatformPackageName("win32", "x64"), null);
  });
});

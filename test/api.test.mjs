import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ErrorCodes,
  PdfiumNodeError,
  renderPdfThumbnails,
} from "@sebastian-software/pdfium-node";
import { getPlatformPackageName } from "../packages/pdfium-node/src/platform.js";

const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

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
        error.code === ErrorCodes.PdfiumError &&
        error.message.includes("not implemented")
    );
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

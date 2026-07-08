import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("native skeleton", () => {
  it("loads native build info on darwin arm64", async (context) => {
    if (process.platform !== "darwin" || process.arch !== "arm64") {
      context.skip("darwin-arm64 native skeleton is not built on this platform");
      return;
    }

    const nativePackage = await import("@sebastian-software/pdfium-node-darwin-arm64");
    assert.deepEqual(nativePackage.getNativeBuildInfo(), {
      backend: "node-api",
      platform: "darwin",
      arch: "arm64",
      pdfiumLinked: true,
      pdfiumSource: "bblanchon/pdfium-binaries",
      pdfiumRevision: "chromium/7934",
    });
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("native skeleton", () => {
  it("loads native build info on supported native platforms", async (context) => {
    const expected = getExpectedNativePackage();

    if (!expected) {
      context.skip("native PDFium build is not configured on this platform");
      return;
    }

    const nativePackage = await import(expected.packageName);
    assert.deepEqual(nativePackage.getNativeBuildInfo(), {
      backend: "node-api",
      platform: expected.platform,
      arch: expected.arch,
      pdfiumLinked: true,
      pdfiumSource: "bblanchon/pdfium-binaries",
      pdfiumRevision: "chromium/7934",
    });
  });
});

function getExpectedNativePackage() {
  if (process.platform === "darwin" && process.arch === "arm64") {
    return {
      packageName: "@sebastian-software/pdfium-node-darwin-arm64",
      platform: "darwin",
      arch: "arm64",
    };
  }

  if (process.platform === "linux" && process.arch === "x64") {
    return {
      packageName: "@sebastian-software/pdfium-node-linux-x64-gnu",
      platform: "linux",
      arch: "x64",
    };
  }

  return null;
}

# Build a native Node.js PDFium thumbnail renderer

## Summary

Build a small open-source Node.js package that renders selected PDF pages into JPEG or PNG thumbnails using native PDFium bindings.

The package should be backend-only, avoid PDF.js, avoid WebAssembly, and expose a narrow API for thumbnail generation from PDF bytes.

## Problem

Applications often need lightweight previews for uploaded PDF documents. A common implementation path is to render previews in the browser with PDF.js, but that pushes PDF rendering into the frontend and can require extra worker assets, WebAssembly decoders, CSP changes, and upload-flow side effects.

For server-rendered or backend-heavy applications, this is not ideal. PDF rendering should be isolated, bounded, observable, and testable on the backend.

MuPDF is not an option because of licensing constraints. PDFium is the preferred rendering engine.

## Goal

Create a focused package that converts selected pages of a PDF into thumbnail images:

```ts
const thumbnails = await renderPdfThumbnails(pdfBytes, {
  pages: [1, 2, 3],
  maxWidth: 1000,
  format: "jpeg",
  quality: 72,
  timeoutMs: 5000,
  maxPixels: 4_000_000,
});
```

The package should return:

```ts
interface RenderedPdfThumbnail {
  page: number;
  width: number;
  height: number;
  mimeType: "image/jpeg" | "image/png";
  data: Uint8Array;
}
```

## Non-Goals

- General PDF viewing
- Text extraction
- OCR
- Form handling
- Annotation handling
- PDF JavaScript execution
- Client-side rendering
- WebAssembly fallback
- MuPDF support
- Rendering every page by default

## Proposed API

```ts
export interface RenderPdfThumbnailsOptions {
  pages: number[];
  maxWidth?: number;
  format?: "jpeg" | "png";
  quality?: number;
  timeoutMs?: number;
  maxPixels?: number;
}

export interface RenderedPdfThumbnail {
  page: number;
  width: number;
  height: number;
  mimeType: "image/jpeg" | "image/png";
  data: Uint8Array;
}

export function renderPdfThumbnails(
  pdf: Uint8Array | Buffer,
  options: RenderPdfThumbnailsOptions
): Promise<RenderedPdfThumbnail[]>;
```

Suggested defaults:

- `maxWidth`: `1000`
- `format`: `"jpeg"`
- `quality`: `72`
- `timeoutMs`: `5000`
- `maxPixels`: `4_000_000`

The caller must explicitly request pages. The library should not default to rendering all pages.

## Architecture

Use native PDFium bindings through one of:

- `napi-rs`
- `node-addon-api`

Avoid plain FFI for the first production version. Pointer ownership, memory safety, deployment behavior, and error handling are likely to be more fragile with FFI.

The native layer should expose only a minimal render operation:

```text
PDF bytes + render options -> image bytes + dimensions
```

The JavaScript layer should handle:

- option validation;
- platform package loading;
- worker/process orchestration;
- timeout handling;
- error normalization.

## Isolation and Timeouts

Reliable cancellation is a core requirement. If PDFium hangs or spends too long inside native code, a JavaScript `AbortSignal` is not enough.

Preferred design:

- run each render job in an isolated worker process;
- enforce hard timeouts by terminating the worker process;
- return typed errors to the caller;
- keep native PDFium state out of the main application process.

This is heavier than an in-process binding, but thumbnail generation is usually an upload-time or background operation, not a hot request path.

## Distribution

Publish a JavaScript wrapper package plus optional platform packages.

Example package layout:

```text
pdfium-thumbnails
pdfium-thumbnails-linux-x64-gnu
pdfium-thumbnails-linux-arm64-gnu
pdfium-thumbnails-darwin-arm64
pdfium-thumbnails-darwin-x64
```

Initial platform support:

1. Linux x64 glibc
2. macOS arm64
3. Linux arm64 if needed

Windows should not be promised until CI, packaging, and binary validation are in place.

## Licensing and Notices

The package must include:

- PDFium license text;
- required third-party notices for the bundled PDFium build;
- a publish-time check that verifies license and notice files are present;
- README language that clearly states the package bundles PDFium binaries.

MuPDF must not be used.

## Test Plan

Package-level tests:

- option validation;
- invalid page requests;
- malformed PDF handling;
- encrypted/password-protected PDF handling;
- oversized page or pixel-limit rejection;
- simple vector PDF render;
- image-heavy PDF render;
- JPEG output;
- PNG output;
- timeout behavior;
- repeated render calls without memory/process leaks.

Fixture set:

- simple one-page vector PDF;
- multi-page PDF;
- image-heavy PDF;
- malformed PDF;
- encrypted PDF;
- large-dimension PDF;
- optional JPEG 2000 PDF if a legally distributable fixture is available.

CI matrix:

- Linux x64 glibc;
- macOS arm64;
- additional targets only after packaging support exists.

## Spike Plan

### Spike 1: Native PDFium Rendering

Prove that a Node.js process can render one PDF page to a JPEG thumbnail without PDF.js or WebAssembly.

Exit criteria:

- renders a fixture PDF page to JPEG;
- runs on macOS arm64;
- runs on Linux x64;
- exposes a minimal async JS API;
- records binary size and cold-start behavior.

### Spike 2: Process Isolation

Prove hard timeout behavior.

Exit criteria:

- render work runs outside the caller process;
- timeout kills the worker process;
- caller receives a typed timeout error;
- invalid PDFs do not crash the caller;
- no orphan worker processes remain after failure.

### Spike 3: Package Distribution

Prove install and runtime loading.

Exit criteria:

- wrapper package resolves the correct platform package;
- install works from a packed tarball;
- missing platform package produces a useful error;
- license and notice files ship in the package.

## Risks

- PDFium binary packaging may become maintenance-heavy.
- Native binaries may behave differently across deployment platforms.
- PDFium security updates need a clear maintenance process.
- Hard cancellation requires subprocess isolation.
- Realistic PDF fixtures may be difficult to redistribute.
- Scope could creep into a general PDF toolkit.

## Acceptance Criteria

- The package renders selected PDF pages to JPEG or PNG thumbnails from PDF bytes.
- It does not depend on PDF.js.
- It does not use WebAssembly.
- It uses PDFium.
- It supports at least Linux x64 glibc and macOS arm64.
- It enforces page, pixel, and timeout limits.
- It returns typed errors for unsupported, malformed, encrypted, oversized, and timed-out PDFs.
- It includes PDFium license and notice files.
- It has fixture-based tests in CI.
- The README documents supported platforms, limits, licensing, and non-goals.

# pdfium-node

Native PDFium access for Node.js on Linux and macOS.

This project is in early implementation. The first production capability is selected-page thumbnail rendering from PDF bytes to JPEG or PNG image bytes. The public API is intentionally task-oriented and does not expose raw PDFium handles.

Current implementation status:

- macOS arm64 can render selected pages to PNG and JPEG through native PDFium.
- Linux x64 glibc has the same native PNG and JPEG rendering path configured for Linux builds.

## Goals

- Render selected PDF pages on the backend.
- Use native PDFium bindings through Node-API.
- Avoid PDF.js and WebAssembly.
- Keep rendering isolated from the caller process.
- Ship prebuilt packages for supported platforms.
- Publish under the `@sebastian-software/pdfium-node` package name.

## Non-Goals

- Browser PDF viewing.
- Full PDFium API coverage.
- Raw native pointer, document handle, or page handle access from JavaScript.
- Text extraction, OCR, form handling, annotation handling, or PDF editing.
- Rendering every page by default.
- MuPDF support.

## Planned API

```ts
import { renderPdfThumbnails } from "@sebastian-software/pdfium-node";

const thumbnails = await renderPdfThumbnails(pdfBytes, {
  pages: [1],
  maxWidth: 1000,
  format: "jpeg",
  quality: 72,
  timeoutMs: 5000,
  maxPixels: 4_000_000,
});
```

The macOS arm64 and Linux x64 glibc implementations currently support PNG and JPEG output when built on their target platforms.

## Current Quick Start

```ts
import { readFile } from "node:fs/promises";
import { renderPdfThumbnails } from "@sebastian-software/pdfium-node";

const pdf = await readFile("document.pdf");
const [thumbnail] = await renderPdfThumbnails(pdf, {
  pages: [1],
  format: "png",
  maxWidth: 1000,
  timeoutMs: 5000,
  maxPixels: 4_000_000,
});

console.log(thumbnail.page, thumbnail.width, thumbnail.height, thumbnail.mimeType);
```

## Known Limitations

- The `quality` option applies to JPEG output and has no effect on PNG output.
- Only a white background is currently supported. Transparent PNG output is intentionally deferred.
- Password-protected and encrypted PDFs are rejected in the MVP.
- The package does not expose document metadata, page count, text extraction, raw PDFium handles, or a general PDFium API.
- Rendering uses one worker process per render request. Worker pools and OS-level sandboxing are deferred.
- Initial platform packages target Linux x64 glibc and macOS arm64 only. Linux musl, Linux arm64, macOS x64, and Windows are deferred.

## Platform Policy

Initial targets:

- Linux x64 glibc
- macOS arm64

Deferred targets:

- Linux arm64
- macOS x64
- Linux musl
- Windows

The minimum supported Node.js version is 22. The project targets active Node.js LTS release lines.

## Documentation

- [RFC](./pdfium-thumbnail-renderer-rfc.md)
- [Milestone plan](./docs/milestones.md)
- [Architecture Decision Records](./docs/adr/README.md)
- [Native build](./docs/native-build.md)
- [Native measurements](./docs/native-measurements.md)
- [Releasing](./docs/releasing.md)
- [Follow-up work](./docs/follow-up-work.md)
- [Contributing](./CONTRIBUTING.md)
- [Security](./SECURITY.md)

## Licensing

Project-owned wrapper code is licensed under MIT.

PDFium and third-party components bundled with PDFium remain governed by their own licenses and notices. Binary packages must include the required PDFium license text and notices.

The upstream PDFium license reference is tracked in [third_party/pdfium/LICENSE](./third_party/pdfium/LICENSE).

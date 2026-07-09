# pdfium-node

Native PDFium access for Node.js on Linux and macOS.

This package provides selected-page thumbnail rendering from PDF bytes to JPEG or PNG image bytes. The public API is intentionally task-oriented and does not expose raw PDFium handles.

Stable platform support:

- macOS arm64 can render selected pages to PNG and JPEG through native PDFium.
- Linux x64 glibc has the same native PNG and JPEG rendering path configured for Linux builds.

## Goals

- Render selected PDF pages on the backend.
- Use native PDFium bindings through Node-API.
- Avoid PDF.js and WebAssembly.
- Keep rendering isolated from the caller process.
- Ship prebuilt packages for supported platforms.
- Publish under the `pdfium-node` package name.

## Non-Goals

- Browser PDF viewing.
- Full PDFium API coverage.
- Raw native pointer, document handle, or page handle access from JavaScript.
- Text extraction, OCR, form handling, annotation handling, or PDF editing.
- Rendering every page by default.
- MuPDF support.

## API

```ts
import { renderPdfThumbnails } from "pdfium-node";

const thumbnails = await renderPdfThumbnails(pdfBytes, {
  pages: [1],
  maxWidth: 1000,
  format: "jpeg",
  quality: 72,
  timeoutMs: 5000,
  maxPixels: 4_000_000,
});
```

The macOS arm64 and Linux x64 glibc packages support PNG and JPEG output.

## Quick Start

```ts
import { readFile } from "node:fs/promises";
import { renderPdfThumbnails } from "pdfium-node";

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
- Password-protected and encrypted PDFs are rejected by the stable API.
- The package does not expose document metadata, page count, text extraction, raw PDFium handles, or a general PDFium API.
- Rendering uses one worker process per render request. Worker pools and OS-level sandboxing are deferred.
- Stable platform packages target Linux x64 glibc and macOS arm64. Linux arm64 and Linux musl are planned server and edge follow-up targets. macOS x64 and Windows are not planned without concrete demand.

## Platform Policy

Stable targets:

- Linux x64 glibc
- macOS arm64

Deferred targets:

- Linux arm64
- Linux musl
- Windows

Linux arm64 and musl are planned follow-up targets for server and edge deployments. macOS x64 is not planned unless a concrete user or maintainer need appears.

The minimum supported Node.js version is 22. The project targets active Node.js LTS release lines.

## Documentation

- [RFC](./pdfium-thumbnail-renderer-rfc.md)
- [Milestone plan](./docs/milestones.md)
- [Architecture Decision Records](./docs/adr/README.md)
- [Native build](./docs/native-build.md)
- [Native measurements](./docs/native-measurements.md)
- [Releasing](./docs/releasing.md)
- [1.0 readiness](./docs/1.0-readiness.md)
- [Follow-up work](./docs/follow-up-work.md)
- [Contributing](./CONTRIBUTING.md)
- [Security](./SECURITY.md)

## Licensing

Project-owned wrapper code is licensed under MIT.

PDFium and third-party components bundled with PDFium remain governed by their own licenses and notices. Binary packages must include the required PDFium license text and notices.

The upstream PDFium license reference is tracked in [third_party/pdfium/LICENSE](./third_party/pdfium/LICENSE).

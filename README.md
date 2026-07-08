# pdfium-node

Native PDFium access for Node.js on Linux and macOS.

This project is in early implementation. The first production capability is selected-page thumbnail rendering from PDF bytes to JPEG or PNG image bytes. The public API is intentionally task-oriented and does not expose raw PDFium handles.

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

The initial implementation will fail with typed errors until native rendering and platform packages are available.

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
- [Releasing](./docs/releasing.md)
- [Contributing](./CONTRIBUTING.md)
- [Security](./SECURITY.md)

## Licensing

Project-owned wrapper code is licensed under MIT.

PDFium and third-party components bundled with PDFium remain governed by their own licenses and notices. Binary packages must include the required PDFium license text and notices.

The upstream PDFium license reference is tracked in [third_party/pdfium/LICENSE](./third_party/pdfium/LICENSE).

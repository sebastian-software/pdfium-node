# pdfium-node

Native PDFium access for Node.js.

The package currently provides option validation, typed errors, worker-process isolation, platform package resolution, and PNG/JPEG rendering through native PDFium on supported platform builds.

## Stable Support Contract

The stable package support contract covers the `renderPdfThumbnails` and `getPdfiumNodeBuildInfo` APIs, documented typed error codes, Linux x64 glibc, macOS arm64, and active Node.js LTS releases.

## Current Usage

```ts
import { readFile } from "node:fs/promises";
import { getPdfiumNodeBuildInfo, renderPdfThumbnails } from "pdfium-node";

const pdf = await readFile("document.pdf");
const thumbnails = await renderPdfThumbnails(pdf, {
  pages: [1],
  format: "png",
  maxWidth: 1000,
});

const buildInfo = await getPdfiumNodeBuildInfo();
console.log(buildInfo.platformPackageName, buildInfo.pdfiumVersion);
```

## Known Limitations

- Password-protected and encrypted PDFs are rejected by the stable API.
- Only Linux x64 glibc and macOS arm64 are initial native package targets.
- Raw PDFium handles, document metadata, text extraction, and full PDFium API coverage are out of scope.

# @sebastian-software/pdfium-node

Native PDFium access for Node.js.

The package currently provides option validation, typed errors, worker-process isolation, platform package resolution, and PNG rendering through native PDFium on supported platform builds.

## Current Usage

```ts
import { readFile } from "node:fs/promises";
import { renderPdfThumbnails } from "@sebastian-software/pdfium-node";

const pdf = await readFile("document.pdf");
const thumbnails = await renderPdfThumbnails(pdf, {
  pages: [1],
  format: "png",
  maxWidth: 1000,
});
```

## Known Limitations

- JPEG output is not implemented yet.
- Password-protected and encrypted PDFs are rejected in the MVP.
- Only Linux x64 glibc and macOS arm64 are initial native package targets.
- Raw PDFium handles, document metadata, text extraction, and full PDFium API coverage are out of scope.

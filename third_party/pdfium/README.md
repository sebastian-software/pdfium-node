# PDFium

This directory records PDFium licensing and binary provenance.

Supported platform builds import prebuilt PDFium archives from `bblanchon/pdfium-binaries` and bundle the matching shared library, `PDFIUM_VERSION`, and license directory into the generated native npm package artifacts. Generated `prebuilds/` directories are not committed to git.

## License Source

- Upstream: <https://pdfium.googlesource.com/pdfium/>
- License file source: <https://pdfium.googlesource.com/pdfium/+/main/LICENSE>

## Revision Tracking

- Current build source: `bblanchon/pdfium-binaries`
- Current pinned release: `chromium/7934`
- Current PDFium version: `152.0.7934.0`

When the PDFium revision changes, update this file, `docs/native-build.md`, checked-in measurement notes, and the release notes.

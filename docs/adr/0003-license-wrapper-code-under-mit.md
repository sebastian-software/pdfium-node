# 0003. License wrapper code under MIT

Date: 2026-07-08

## Status

Accepted

## Context

The project-owned Node.js wrapper code should be permissively licensed. The package will also bundle or consume PDFium binaries, which remain governed by PDFium and third-party component licenses.

## Decision

Project-owned wrapper code will be licensed under MIT.

The MIT license does not relicense PDFium or third-party components bundled with PDFium. Binary packages must include the required PDFium license text and notices.

MuPDF will not be used because its licensing constraints do not fit this project.

## Consequences

The wrapper code is easy for downstream projects to adopt.

The release process must keep wrapper licensing separate from bundled binary notices.

Publish-time checks should verify that required license and notice files are included in binary packages.

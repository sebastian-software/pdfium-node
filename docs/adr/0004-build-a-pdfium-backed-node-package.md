# 0004. Build a PDFium-backed Node.js package

Date: 2026-07-08

## Status

Accepted

## Context

Applications need backend PDF rendering without pushing PDF preview work into browsers through PDF.js or WebAssembly. PDFium is the preferred rendering engine for this project.

## Decision

The project will build a native Node.js package that makes PDFium available from Node.js on Linux and macOS.

The repository should be developed as `sebastian-software/pdfium-node`. The preferred npm package name is `@sebastian-software/pdfium-node` if the npm scope is available, with `pdfium-node` as the unscoped fallback.

## Consequences

The project identity is broader than thumbnails, but the first public API can remain narrow.

The package must own native binary packaging, platform detection, PDFium notices, and a clear unsupported-platform error path.

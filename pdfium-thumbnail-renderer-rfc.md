# Build a native Node.js PDFium package

## Summary

Build a small open-source Node.js package that makes PDFium available from Node.js through native bindings on Linux and macOS.

The first production capability should be backend thumbnail rendering: render selected PDF pages into JPEG or PNG thumbnails from PDF bytes.

The package should be developed under the `sebastian-software` GitHub organization and published under the MIT license for the wrapper code. Bundled PDFium binaries and their transitive notices remain governed by their own licenses and must be shipped with the npm artifacts.

## Problem

Applications often need lightweight previews for uploaded PDF documents. A common implementation path is to render previews in the browser with PDF.js, but that pushes PDF rendering into the frontend and can require extra worker assets, WebAssembly decoders, CSP changes, and upload-flow side effects.

For server-rendered or backend-heavy applications, this is not ideal. PDF rendering should be isolated, bounded, observable, and testable on the backend.

MuPDF is not an option because of licensing constraints. PDFium is the preferred rendering engine.

## Product Shape

The repository and npm package should be positioned as a PDFium-backed Node.js package, not as a thumbnail-only experiment. The public API should still start narrow.

Recommended framing:

- repository: `sebastian-software/pdfium-node`;
- primary package: `@sebastian-software/pdfium-node` if the npm scope is available, otherwise `pdfium-node`;
- license for project-owned code: MIT;
- runtime support: Node.js active LTS versions at the time of the first stable release;
- initial platforms: Linux x64 glibc and macOS arm64;
- first user-facing feature: selected-page thumbnail rendering.

The package should avoid exposing raw PDFium handles or a broad one-to-one PDFium API in the first version. A raw binding surface would make ownership, lifetime, cancellation, threading, and semver compatibility harder to guarantee. The first stable API should expose task-level operations that can be isolated and tested end-to-end.

## Project Conventions

The project language is English. Repository documentation, code comments, commit messages, release notes, npm package metadata, GitHub issues, pull requests, and ADRs should be written in English unless there is a specific external reason to do otherwise.

Architectural and product decisions should be recorded as Architecture Decision Records under `docs/adr/`. ADRs are immutable decision documents: once accepted, they should not be rewritten to match later thinking. If a decision changes, a new ADR supersedes the older one and links back to it.

The repository should use the classic ADR shape:

- title;
- status;
- context;
- decision;
- consequences.

Initial ADRs have been created for decisions that have already been made in this RFC, including project language, licensing, package shape, native binding direction, process isolation, commit convention, and release automation.

The project should use Conventional Commits for all repository commits. This gives contributors a consistent history and provides structured input for release automation.

Release automation should use Release Please. Release Please should manage version bumps, changelog updates, release pull requests, and GitHub releases based on Conventional Commits. npm publishing should run from GitHub Actions using npm Trusted Publishing instead of long-lived npm tokens.

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

The longer-term product goal is a small set of backend-safe PDFium operations, not a general PDF editor or viewer. Candidate future operations can include page count, basic document metadata, and selected-page raster rendering at explicit dimensions, but these should be added only after the thumbnail path proves packaging, isolation, and maintenance.

## Non-Goals

- General PDF viewing
- Full PDFium API coverage
- Exposing raw native pointers, document handles, or page handles to userland
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
  scale?: number;
  format?: "jpeg" | "png";
  quality?: number;
  timeoutMs?: number;
  maxPixels?: number;
  maxInputBytes?: number;
  background?: "white" | "transparent";
  password?: string;
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
- `scale`: unset; callers should use either `maxWidth` or `scale`, not both
- `format`: `"jpeg"`
- `quality`: `72`
- `timeoutMs`: `5000`
- `maxPixels`: `4_000_000`
- `maxInputBytes`: unset; callers can opt in based on their upload policy
- `background`: `"white"` for JPEG, `"transparent"` for PNG if supported safely
- `password`: unset

The caller must explicitly request pages. The library should not default to rendering all pages.

Page numbers in the JavaScript API should be 1-based because this is what callers usually expect when dealing with PDFs. The native layer can convert to PDFium's internal page indexing.

The initial API should be asynchronous even if the native render operation itself is synchronous, because the intended execution model uses an isolated worker process.

### Optional Document Info API

The MVP does not require a general document API, but one small companion function may be useful for callers that need to decide which pages to render:

```ts
export interface PdfDocumentInfo {
  pageCount: number;
  isEncrypted: boolean;
}

export function getPdfDocumentInfo(
  pdf: Uint8Array | Buffer,
  options?: { timeoutMs?: number; password?: string }
): Promise<PdfDocumentInfo>;
```

This should be treated as optional for the first release. If included, it should use the same isolation and timeout path as rendering.

## Rendering Semantics

The API should make these semantics explicit:

- render output respects page aspect ratio;
- `maxWidth` constrains the final bitmap width and computes height from the page aspect ratio;
- `maxPixels` applies to the final bitmap dimensions before encoding;
- transparent PDF content is flattened against `background` for JPEG;
- PNG may preserve transparency only if this can be implemented consistently across platforms;
- duplicate page numbers are allowed only if the implementation intentionally preserves request order;
- output order should match the requested `pages` order;
- encrypted PDFs without a working password should fail with a typed error;
- password handling is best-effort and should not log or include passwords in error messages.

## Architecture

Use Node-API based native bindings through one of:

- `napi-rs`
- `node-addon-api`

Avoid plain FFI for the first production version. Pointer ownership, memory safety, deployment behavior, and error handling are likely to be more fragile with FFI.

Recommended starting point: `napi-rs`, unless the first spike shows that the PDFium integration is materially simpler in C++ with `node-addon-api`.

Reasons:

- Node-API gives the package a stable addon boundary across supported Node.js versions;
- `napi-rs` fits a small, memory-sensitive native boundary and has good ergonomics for packaged Node addons;
- PDFium itself is C++, so `node-addon-api` remains a credible fallback if Rust bindings add too much friction;
- both options are better aligned with prebuilt native packages than ad hoc FFI.

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

The package should keep a strong boundary between:

- public JavaScript API;
- worker process protocol;
- native binding ABI;
- PDFium build and binary packaging.

This keeps the user-facing API stable even if the native binding or PDFium build strategy changes.

## Isolation and Timeouts

Reliable cancellation is a core requirement. If PDFium hangs or spends too long inside native code, a JavaScript `AbortSignal` is not enough.

Preferred design:

- run each render job in an isolated worker process;
- enforce hard timeouts by terminating the worker process;
- return typed errors to the caller;
- keep native PDFium state out of the main application process.

This is heavier than an in-process binding, but thumbnail generation is usually an upload-time or background operation, not a hot request path.

## Error Model

The JavaScript API should return typed errors with stable `code` values. Error messages can change, but codes should be semver-stable.

Proposed codes:

- `PDFIUM_NODE_UNSUPPORTED_PLATFORM`
- `PDFIUM_NODE_MISSING_NATIVE_PACKAGE`
- `PDFIUM_NODE_INVALID_OPTIONS`
- `PDFIUM_NODE_INVALID_PAGE`
- `PDFIUM_NODE_MALFORMED_PDF`
- `PDFIUM_NODE_ENCRYPTED_PDF`
- `PDFIUM_NODE_PASSWORD_REQUIRED`
- `PDFIUM_NODE_INCORRECT_PASSWORD`
- `PDFIUM_NODE_RENDER_TIMEOUT`
- `PDFIUM_NODE_PIXEL_LIMIT_EXCEEDED`
- `PDFIUM_NODE_PDFIUM_ERROR`
- `PDFIUM_NODE_WORKER_CRASHED`

Errors should include structured metadata where safe, such as `page`, `platform`, `arch`, `format`, or configured limits. They must not include PDF bytes, passwords, or user-provided file names unless the caller explicitly supplied a safe label.

## Distribution

Publish a JavaScript wrapper package plus optional platform packages.

Example package layout:

```text
@sebastian-software/pdfium-node
@sebastian-software/pdfium-node-linux-x64-gnu
@sebastian-software/pdfium-node-linux-arm64-gnu
@sebastian-software/pdfium-node-darwin-arm64
@sebastian-software/pdfium-node-darwin-x64
```

Initial platform support:

1. Linux x64 glibc
2. macOS arm64
3. Linux arm64 if needed
4. macOS x64 only if there is a concrete user need

Windows should not be promised until CI, packaging, and binary validation are in place.

Musl Linux should be treated as a separate target, not implied by Linux support. If Alpine support becomes important, it needs a dedicated spike because libc and dynamic linking behavior can change the packaging approach.

The wrapper package should produce a clear install/runtime error when no compatible platform package exists. It should not silently fall back to source compilation for production installs unless that path is intentionally supported and tested.

## Release and Maintenance

The project should define maintenance expectations before the first stable release:

- track the exact PDFium revision used for each release;
- publish a changelog entry whenever the bundled PDFium revision changes;
- document whether PDFium binaries are built by this project or imported from a trusted upstream build source;
- keep build scripts reproducible enough that maintainers can rebuild the binaries;
- run fixture tests against packed npm tarballs, not only the monorepo source tree;
- use Release Please for release pull requests, changelog updates, version bumps, and GitHub releases;
- publish npm packages from GitHub Actions through npm Trusted Publishing;
- publish with provenance if feasible;
- treat PDFium security updates as patch or minor releases depending on API impact.

Versioning recommendation:

- pre-1.0 while the native packaging and API are being proven;
- `1.0.0` only after Linux x64 glibc and macOS arm64 install from packed packages and pass fixture rendering in CI;
- semver-stable public API after `1.0.0`;
- native worker protocol and native ABI remain internal;
- release versioning and changelog entries are derived from Conventional Commits through Release Please.

## Licensing and Notices

The package must include:

- PDFium license text;
- required third-party notices for the bundled PDFium build;
- a publish-time check that verifies license and notice files are present;
- README language that clearly states the package bundles PDFium binaries.

MuPDF must not be used.

The MIT license applies only to project-owned wrapper code. It does not relicense PDFium or third-party components bundled with PDFium. The README and package metadata should make this clear enough for downstream users to evaluate redistribution.

## Security and Resource Boundaries

PDF files are untrusted input. The implementation should assume malformed or adversarial PDFs.

Required boundaries:

- hard timeout enforced by process termination;
- explicit page allow-list;
- `maxPixels` enforced before image allocation;
- bounded input size if the caller opts in through `maxInputBytes`;
- no PDF JavaScript execution feature exposed;
- no temporary files unless a later implementation proves they are required;
- worker process stderr/stdout kept controlled and not mixed into API responses;
- fuzzing or corpus testing considered after the basic fixture suite is stable.

The first version does not need OS-level sandboxing, but the RFC should leave room for a future sandbox strategy if PDFium exposure becomes part of a multi-tenant ingestion service.

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
- repeated render calls without memory/process leaks;
- platform package resolution;
- packed tarball install and smoke test;
- typed error codes and metadata.

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
- Node.js active LTS release lines;
- additional targets only after packaging support exists.

Release validation should include:

- `npm pack` for wrapper and platform packages;
- install from packed tarballs in a clean fixture project;
- render one known fixture on every supported platform;
- verify license and notice files are included in every package that ships binaries;
- verify unsupported platform errors remain readable.

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

### Spike 4: API Boundary

Decide whether the first package exposes only `renderPdfThumbnails` or also `getPdfDocumentInfo`.

Exit criteria:

- confirms whether page count is needed by the first consumer;
- confirms 1-based page numbering in the public API;
- confirms output ordering and duplicate page behavior;
- documents final error codes for MVP.

## Risks

- PDFium binary packaging may become maintenance-heavy.
- Native binaries may behave differently across deployment platforms.
- PDFium security updates need a clear maintenance process.
- Hard cancellation requires subprocess isolation.
- Realistic PDF fixtures may be difficult to redistribute.
- Scope could creep into a general PDF toolkit.
- Broad "PDFium for Node" positioning could imply unsupported low-level bindings.
- Platform packages can fail in real deployments if libc, CPU architecture, or dynamic library assumptions are too broad.
- PDFium update cadence may be faster than maintainer capacity.
- npm scope availability may affect final package naming.

## Open Questions

These should be resolved before implementation work starts:

1. Should the first npm package be scoped as `@sebastian-software/pdfium-node`, or should it use the unscoped `pdfium-node` name if available?
2. Is the first consumer only thumbnail generation, or does it also need page count before choosing pages?
3. What minimum Node.js version should the first release support?
4. Is Linux arm64 required for the first release, or can it follow after Linux x64 glibc and macOS arm64?
5. Is macOS x64 still worth shipping initially?
6. Should encrypted PDFs with a supplied password be supported in v0.1, or should all encrypted PDFs fail with a clear typed error first?
7. Should PNG transparency be preserved, or should all output be flattened for consistency?
8. What is the expected maximum input PDF size for the first real deployment?
9. Should worker processes be one job per process, or should the package maintain a small reusable worker pool after the timeout spike?
10. Who owns the PDFium update cadence and security response process in the `sebastian-software` organization?

## References Checked

- Node-API documentation: <https://nodejs.org/api/n-api.html>
- `node-addon-api`: <https://github.com/nodejs/node-addon-api>
- `napi-rs`: <https://github.com/napi-rs/napi-rs>
- PDFium license: <https://pdfium.googlesource.com/pdfium/+/main/LICENSE>

## Acceptance Criteria

- The package is developed in `sebastian-software/pdfium-node`.
- Project-owned wrapper code is MIT licensed.
- The project language is English.
- Accepted decisions are recorded as immutable ADRs under `docs/adr/`.
- Commits follow Conventional Commits.
- Release Please manages releases from Conventional Commits.
- npm packages are published through GitHub Actions using npm Trusted Publishing.
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
- Packed npm artifacts install and render a fixture on every supported platform.
- Unsupported platforms fail with a clear, actionable error.

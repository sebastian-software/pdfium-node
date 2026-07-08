# Follow-up Work

This document keeps issue-ready follow-up work in the repository until the public GitHub issue tracker is available. Once the repository is public, each item should become a GitHub issue and link back to the milestone it supports.

## JPEG Output

Implement `format: "jpeg"` and apply the `quality` option consistently across supported platforms.

Acceptance criteria:

- `renderPdfThumbnails` returns `image/jpeg` bytes for JPEG requests.
- `quality` accepts the documented `1` to `100` range.
- Tests cover JPEG output and invalid quality values.
- README examples can use JPEG once the encoder is stable.

## Password-Protected PDFs

Decide whether password-protected PDFs belong in the stable API.

Acceptance criteria:

- The decision is recorded as an ADR if support is added or explicitly rejected for 1.0.
- Passwords are never logged or included in error metadata.
- Tests cover missing, wrong, and correct password behavior if support is added.

## Deferred Platform Packages

Evaluate additional platform packages after the Linux x64 glibc and macOS arm64 path is stable.

Candidate targets:

- Linux arm64.
- macOS x64.
- Linux musl.
- Windows.

Acceptance criteria:

- Each platform has an explicit PDFium binary source or build procedure.
- CI verifies install and rendering on the target.
- README and package metadata document the support level.

## Document Info API

Evaluate a small `getPdfDocumentInfo` API after thumbnail rendering is stable.

Acceptance criteria:

- The API runs through the same worker isolation and timeout path as rendering.
- The MVP returns only page count and encryption state unless a real use case requires more.
- Typed errors match the render API.

## Explicit-Dimension Rendering

Evaluate selected-page raster rendering at explicit dimensions after thumbnail rendering is stable.

Acceptance criteria:

- The API preserves aspect-ratio behavior unless callers intentionally opt into explicit width and height.
- `maxPixels` applies before image bytes are returned.
- Tests cover oversized dimensions and page-order behavior.

## Worker Pool

Evaluate whether repeated rendering workloads need a bounded worker pool.

Acceptance criteria:

- The pool has explicit concurrency limits.
- Timeouts still terminate stuck native work.
- A crashing worker cannot poison future jobs.

## OS-Level Sandboxing

Evaluate process-level sandboxing beyond worker isolation.

Acceptance criteria:

- The sandbox model is documented per supported platform.
- Failure modes remain typed and actionable.
- The implementation does not require elevated privileges for normal use.

## Expanded Corpus Testing

Add fuzzing or a broader legal PDF corpus after the basic clean-room fixture suite is stable.

Acceptance criteria:

- All corpus inputs are redistributable or generated during CI.
- Regressions produce small, reproducible fixtures.
- The suite remains practical for regular CI.

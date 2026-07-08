# Follow-up Work

This document keeps issue-ready follow-up work in the repository until the public GitHub issue tracker is available. Once the repository is public, each item should become a GitHub issue and link back to the milestone it supports.

## Password-Protected PDFs

GitHub issue: [#1](https://github.com/sebastian-software/pdfium-node/issues/1)

Decide whether password-protected PDFs belong in the stable API.

Acceptance criteria:

- The decision is recorded as an ADR if support is added or explicitly rejected for 1.0.
- Passwords are never logged or included in error metadata.
- Tests cover missing, wrong, and correct password behavior if support is added.

## Linux Server and Edge Platform Packages

GitHub issue: [#3](https://github.com/sebastian-software/pdfium-node/issues/3)

Add Linux platform packages that matter for server and edge deployments after the Linux x64 glibc and macOS arm64 path is stable.

Planned targets:

- Linux arm64 glibc.
- Linux x64 musl.
- Linux arm64 musl if the PDFium binary source, linking model, and CI path are practical.

Out of scope:

- macOS x64 unless a concrete user or maintainer need appears.
- Windows until there is concrete demand and dedicated CI, packaging, and binary validation.

Acceptance criteria:

- Each platform has an explicit PDFium binary source or build procedure.
- CI verifies install and rendering on the target.
- README and package metadata document the support level.
- npm Trusted Publishing is configured for every new platform package.

## Document Info API

GitHub issue: [#4](https://github.com/sebastian-software/pdfium-node/issues/4)

Evaluate a small `getPdfDocumentInfo` API after thumbnail rendering is stable.

Acceptance criteria:

- The API runs through the same worker isolation and timeout path as rendering.
- The MVP returns only page count and encryption state unless a real use case requires more.
- Typed errors match the render API.

## Explicit-Dimension Rendering

GitHub issue: [#5](https://github.com/sebastian-software/pdfium-node/issues/5)

Evaluate selected-page raster rendering at explicit dimensions after thumbnail rendering is stable.

Acceptance criteria:

- The API preserves aspect-ratio behavior unless callers intentionally opt into explicit width and height.
- `maxPixels` applies before image bytes are returned.
- Tests cover oversized dimensions and page-order behavior.

## Worker Pool

GitHub issue: [#6](https://github.com/sebastian-software/pdfium-node/issues/6)

Evaluate whether repeated rendering workloads need a bounded worker pool.

Acceptance criteria:

- The pool has explicit concurrency limits.
- Timeouts still terminate stuck native work.
- A crashing worker cannot poison future jobs.

## OS-Level Sandboxing

GitHub issue: [#7](https://github.com/sebastian-software/pdfium-node/issues/7)

Evaluate process-level sandboxing beyond worker isolation.

Acceptance criteria:

- The sandbox model is documented per supported platform.
- Failure modes remain typed and actionable.
- The implementation does not require elevated privileges for normal use.

## Expanded Corpus Testing

GitHub issue: [#8](https://github.com/sebastian-software/pdfium-node/issues/8)

Add fuzzing or a broader legal PDF corpus after the basic clean-room fixture suite is stable.

Acceptance criteria:

- All corpus inputs are redistributable or generated during CI.
- Regressions produce small, reproducible fixtures.
- The suite remains practical for regular CI.

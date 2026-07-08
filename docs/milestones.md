# Milestone Plan

This plan tracks the path from RFC to a stable npm package. It is intentionally checklist-shaped so project work can be reviewed and checked off as it lands.

## Milestone 0: Project Foundation

Goal: make the repository ready for public implementation work.

Exit criteria: contributors can understand the project direction, decision process, commit rules, and release model before reading implementation code.

- [x] Add `README.md` with project summary, status, supported platforms, non-goals, and licensing note.
- [x] Add `LICENSE` for project-owned MIT code.
- [x] Add `CONTRIBUTING.md` with English-language contribution rules and Conventional Commit guidance.
- [x] Add `CODE_OF_CONDUCT.md`.
- [x] Add `SECURITY.md` with vulnerability reporting expectations.
- [x] Add ADR index linking all accepted ADRs.
- [x] Decide final npm package name: `pdfium-node`.
- [x] Decide minimum supported Node.js version.
- [x] Decide whether Linux arm64 and macOS x64 are initial or follow-up targets.
- [x] Decide first-release behavior for encrypted PDFs and password support.
- [x] Decide whether PNG transparency is preserved or all output is flattened.

## Milestone 1: Repository and Tooling Baseline

Goal: establish the JavaScript package workspace and validation tools.

Exit criteria: the repository has a repeatable local development loop and CI can run the same checks.

- [x] Create package workspace structure for the wrapper package and native package targets.
- [x] Add TypeScript configuration.
- [x] Add linting and formatting.
- [x] Add test runner.
- [x] Add CI for lint, typecheck, and tests.
- [x] Add commit message guidance or validation for Conventional Commits.
- [x] Add fixture directory structure and fixture licensing notes.
- [x] Add initial clean-room fixture PDFs that can be redistributed.
- [x] Add a documentation check for ADR links and required project docs.

## Milestone 2: Native PDFium Rendering Spike

Goal: prove that Node.js can render a PDF page through native PDFium without PDF.js or WebAssembly.

Exit criteria: one fixture page renders to image bytes on macOS arm64 and Linux x64.

- [x] Select initial native binding implementation: `napi-rs` unless the spike proves `node-addon-api` is materially simpler.
- [x] Record binding decision or change as an ADR if the RFC direction changes.
- [x] Add minimal native package skeleton.
- [x] Link or bundle a known PDFium build for local development.
- [x] Render one page from PDF bytes to an in-memory bitmap.
- [x] Encode JPEG output.
- [x] Return width, height, MIME type, page number, and image bytes to JavaScript.
- [x] Measure binary size.
- [x] Measure cold-start render time.
- [x] Document PDFium revision and build source.

## Milestone 3: Public API MVP

Goal: expose the first task-oriented JavaScript API.

Exit criteria: callers can render selected pages with validated options and stable error codes.

- [x] Implement `renderPdfThumbnails(pdf, options)`.
- [x] Validate required `pages` input.
- [x] Use 1-based page numbers in the public API.
- [x] Preserve requested page order in results.
- [x] Decide and implement duplicate page behavior.
- [x] Implement `maxWidth`.
- [x] Implement `maxPixels`.
- [x] Implement `maxInputBytes`.
- [x] Implement JPEG output with `quality`.
- [x] Implement PNG output.
- [x] Implement `background` behavior.
- [x] Decide whether to include `getPdfDocumentInfo` in the MVP.
- [x] Normalize typed errors with stable `code` values.
- [x] Add TypeScript declarations for the public API.
- [x] Add API examples to README.

## Milestone 4: Process Isolation and Resource Limits

Goal: make native rendering survivable for untrusted PDFs.

Exit criteria: malformed, slow, or crashing render work does not crash or block the caller process.

- [x] Define worker process protocol.
- [x] Run render jobs outside the caller process.
- [x] Enforce `timeoutMs` by terminating the worker process.
- [x] Return `PDFIUM_NODE_RENDER_TIMEOUT` for timeouts.
- [x] Return `PDFIUM_NODE_WORKER_CRASHED` for worker exits.
- [x] Ensure no orphan worker processes remain after timeout or crash.
- [x] Ensure worker stdout and stderr do not leak into API responses.
- [x] Verify invalid PDFs do not crash the caller process.
- [x] Decide whether worker processes are one-job-per-process or pooled.
- [x] Record worker lifecycle decision as an ADR if it changes the accepted isolation model.

## Milestone 5: Platform Packages and Install Experience

Goal: make prebuilt package installation work on supported platforms.

Exit criteria: the wrapper package loads the correct native package and gives useful errors otherwise.

- [x] Create wrapper package.
- [x] Create Linux x64 glibc native package.
- [x] Create macOS arm64 native package.
- [x] Add optional native package dependency resolution.
- [x] Detect unsupported platform and architecture combinations.
- [x] Return `PDFIUM_NODE_UNSUPPORTED_PLATFORM` for unsupported targets.
- [x] Return `PDFIUM_NODE_MISSING_NATIVE_PACKAGE` when the expected native package is not installed.
- [x] Verify install from packed tarballs in a clean fixture project.
- [x] Verify runtime loading from packed tarballs.
- [x] Keep source compilation disabled unless intentionally supported and tested.
- [x] Document musl Linux as unsupported unless a dedicated target is added.

## Milestone 6: Fixture Coverage and CI Matrix

Goal: prove behavior against realistic and legally redistributable PDFs.

Exit criteria: the CI matrix catches rendering, packaging, and error-regression issues.

- [x] Test simple one-page vector PDF rendering.
- [x] Test multi-page PDF rendering.
- [x] Test image-heavy PDF rendering.
- [x] Test malformed PDF handling.
- [x] Test encrypted PDF handling.
- [x] Test oversized page or pixel-limit rejection.
- [x] Test JPEG output.
- [x] Test PNG output.
- [x] Test timeout behavior.
- [x] Test repeated render calls for process or memory leaks.
- [x] Test platform package resolution.
- [x] Test typed error codes and safe metadata.
- [x] Add Linux x64 glibc CI coverage.
- [x] Add macOS arm64 CI coverage.
- [x] Add supported Node.js active LTS versions to CI.
- [x] Add packed-tarball smoke tests to CI.

## Milestone 7: Licensing, Notices, and Supply Chain

Goal: make redistribution and binary provenance explicit.

Exit criteria: every package that ships binaries includes the required notices and release metadata.

- [x] Include PDFium license text.
- [x] Include required third-party notices for the bundled PDFium build.
- [x] Add publish-time check for license and notice files.
- [x] Document that MIT applies only to project-owned wrapper code.
- [x] Document bundled PDFium binary licensing in README.
- [x] Track exact PDFium revision in release metadata.
- [x] Document whether PDFium binaries are built by this project or imported from a trusted upstream build source.
- [x] Keep binary build scripts reproducible enough for maintainers to rebuild artifacts.
- [x] Add dependency and artifact provenance notes to release documentation.

## Milestone 8: Release Automation

Goal: make releases reviewable, repeatable, and tokenless.

Exit criteria: Release Please can prepare releases and GitHub Actions can publish to npm through Trusted Publishing.

- [x] Add Release Please configuration.
- [x] Configure release pull requests from Conventional Commits.
- [x] Configure changelog updates.
- [x] Configure version updates for wrapper and platform packages.
- [x] Configure GitHub release creation.
- [x] Configure npm Trusted Publishing for the wrapper package.
- [x] Configure npm Trusted Publishing for native platform packages.
- [x] Add publish workflow dry-run or packed-artifact validation.
- [x] Publish with provenance if feasible.
- [x] Document release procedure for maintainers.

## Milestone 9: Public Preview Release

Goal: publish a pre-1.0 package that proves the full operational path.

Exit criteria: a real user can install the package from npm and render a fixture on supported platforms.

- [x] Complete all Milestone 0-8 required items.
- [ ] Publish first pre-1.0 release ([#9](https://github.com/sebastian-software/pdfium-node/issues/9)).
- [ ] Verify npm install on Linux x64 glibc ([#9](https://github.com/sebastian-software/pdfium-node/issues/9)).
- [ ] Verify npm install on macOS arm64 ([#9](https://github.com/sebastian-software/pdfium-node/issues/9)).
- [ ] Verify README quick start works from the published package ([#9](https://github.com/sebastian-software/pdfium-node/issues/9)).
- [x] Verify unsupported platform error is actionable.
- [ ] Verify license and notice files are present in published package tarballs ([#9](https://github.com/sebastian-software/pdfium-node/issues/9)).
- [x] Record known limitations in README.
- [x] Open follow-up issues for deferred platforms and deferred API decisions.

## Milestone 10: 1.0 Release

Goal: declare the public API and platform support stable.

Exit criteria: the package is safe to recommend for supported backend thumbnail rendering use cases.

- [x] Resolve all MVP open questions from the RFC.
- [x] Confirm public API stability.
- [x] Confirm typed error code stability.
- [ ] Confirm Linux x64 glibc support ([#10](https://github.com/sebastian-software/pdfium-node/issues/10)).
- [ ] Confirm macOS arm64 support ([#10](https://github.com/sebastian-software/pdfium-node/issues/10)).
- [x] Confirm active Node.js LTS support policy.
- [x] Confirm PDFium update and security response ownership.
- [ ] Confirm packed npm artifacts install and render fixtures on all supported platforms ([#10](https://github.com/sebastian-software/pdfium-node/issues/10)).
- [x] Confirm README documents supported platforms, limits, licensing, and non-goals.
- [ ] Confirm Release Please produces the 1.0 release pull request ([#10](https://github.com/sebastian-software/pdfium-node/issues/10)).
- [ ] Publish `1.0.0` through npm Trusted Publishing ([#10](https://github.com/sebastian-software/pdfium-node/issues/10)).

## Deferred Work

These items are intentionally outside the first stable release unless a real user need changes the priority.

- [ ] Linux arm64 platform package.
- [ ] macOS x64 platform package.
- [ ] Musl Linux platform package.
- [ ] Windows support.
- [ ] `getPdfDocumentInfo`.
- [ ] Basic metadata API.
- [ ] Selected-page raster rendering at explicit dimensions.
- [ ] Worker pool.
- [ ] OS-level sandboxing.
- [ ] Fuzzing or corpus testing beyond the basic fixture suite.

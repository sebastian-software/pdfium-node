# Milestone Plan

This plan tracks the path from RFC to a stable npm package. It is intentionally checklist-shaped so project work can be reviewed and checked off as it lands.

## Milestone 0: Project Foundation

Goal: make the repository ready for public implementation work.

Exit criteria: contributors can understand the project direction, decision process, commit rules, and release model before reading implementation code.

- [ ] Add `README.md` with project summary, status, supported platforms, non-goals, and licensing note.
- [ ] Add `LICENSE` for project-owned MIT code.
- [ ] Add `CONTRIBUTING.md` with English-language contribution rules and Conventional Commit guidance.
- [ ] Add `CODE_OF_CONDUCT.md`.
- [ ] Add `SECURITY.md` with vulnerability reporting expectations.
- [ ] Add ADR index linking all accepted ADRs.
- [ ] Decide final npm package name: `@sebastian-software/pdfium-node` or `pdfium-node`.
- [ ] Decide minimum supported Node.js version.
- [ ] Decide whether Linux arm64 and macOS x64 are initial or follow-up targets.
- [ ] Decide first-release behavior for encrypted PDFs and password support.
- [ ] Decide whether PNG transparency is preserved or all output is flattened.

## Milestone 1: Repository and Tooling Baseline

Goal: establish the JavaScript package workspace and validation tools.

Exit criteria: the repository has a repeatable local development loop and CI can run the same checks.

- [ ] Create package workspace structure for the wrapper package and native package targets.
- [ ] Add TypeScript configuration.
- [ ] Add linting and formatting.
- [ ] Add test runner.
- [ ] Add CI for lint, typecheck, and tests.
- [ ] Add commit message guidance or validation for Conventional Commits.
- [ ] Add fixture directory structure and fixture licensing notes.
- [ ] Add initial clean-room fixture PDFs that can be redistributed.
- [ ] Add a documentation check for ADR links and required project docs.

## Milestone 2: Native PDFium Rendering Spike

Goal: prove that Node.js can render a PDF page through native PDFium without PDF.js or WebAssembly.

Exit criteria: one fixture page renders to image bytes on macOS arm64 and Linux x64.

- [ ] Select initial native binding implementation: `napi-rs` unless the spike proves `node-addon-api` is materially simpler.
- [ ] Record binding decision or change as an ADR if the RFC direction changes.
- [ ] Add minimal native package skeleton.
- [ ] Link or bundle a known PDFium build for local development.
- [ ] Render one page from PDF bytes to an in-memory bitmap.
- [ ] Encode JPEG output.
- [ ] Return width, height, MIME type, page number, and image bytes to JavaScript.
- [ ] Measure binary size.
- [ ] Measure cold-start render time.
- [ ] Document PDFium revision and build source.

## Milestone 3: Public API MVP

Goal: expose the first task-oriented JavaScript API.

Exit criteria: callers can render selected pages with validated options and stable error codes.

- [ ] Implement `renderPdfThumbnails(pdf, options)`.
- [ ] Validate required `pages` input.
- [ ] Use 1-based page numbers in the public API.
- [ ] Preserve requested page order in results.
- [ ] Decide and implement duplicate page behavior.
- [ ] Implement `maxWidth`.
- [ ] Implement `maxPixels`.
- [ ] Implement `maxInputBytes`.
- [ ] Implement JPEG output with `quality`.
- [ ] Implement PNG output.
- [ ] Implement `background` behavior.
- [ ] Decide whether to include `getPdfDocumentInfo` in the MVP.
- [ ] Normalize typed errors with stable `code` values.
- [ ] Add TypeScript declarations for the public API.
- [ ] Add API examples to README.

## Milestone 4: Process Isolation and Resource Limits

Goal: make native rendering survivable for untrusted PDFs.

Exit criteria: malformed, slow, or crashing render work does not crash or block the caller process.

- [ ] Define worker process protocol.
- [ ] Run render jobs outside the caller process.
- [ ] Enforce `timeoutMs` by terminating the worker process.
- [ ] Return `PDFIUM_NODE_RENDER_TIMEOUT` for timeouts.
- [ ] Return `PDFIUM_NODE_WORKER_CRASHED` for worker exits.
- [ ] Ensure no orphan worker processes remain after timeout or crash.
- [ ] Ensure worker stdout and stderr do not leak into API responses.
- [ ] Verify invalid PDFs do not crash the caller process.
- [ ] Decide whether worker processes are one-job-per-process or pooled.
- [ ] Record worker lifecycle decision as an ADR if it changes the accepted isolation model.

## Milestone 5: Platform Packages and Install Experience

Goal: make prebuilt package installation work on supported platforms.

Exit criteria: the wrapper package loads the correct native package and gives useful errors otherwise.

- [ ] Create wrapper package.
- [ ] Create Linux x64 glibc native package.
- [ ] Create macOS arm64 native package.
- [ ] Add optional native package dependency resolution.
- [ ] Detect unsupported platform and architecture combinations.
- [ ] Return `PDFIUM_NODE_UNSUPPORTED_PLATFORM` for unsupported targets.
- [ ] Return `PDFIUM_NODE_MISSING_NATIVE_PACKAGE` when the expected native package is not installed.
- [ ] Verify install from packed tarballs in a clean fixture project.
- [ ] Verify runtime loading from packed tarballs.
- [ ] Keep source compilation disabled unless intentionally supported and tested.
- [ ] Document musl Linux as unsupported unless a dedicated target is added.

## Milestone 6: Fixture Coverage and CI Matrix

Goal: prove behavior against realistic and legally redistributable PDFs.

Exit criteria: the CI matrix catches rendering, packaging, and error-regression issues.

- [ ] Test simple one-page vector PDF rendering.
- [ ] Test multi-page PDF rendering.
- [ ] Test image-heavy PDF rendering.
- [ ] Test malformed PDF handling.
- [ ] Test encrypted PDF handling.
- [ ] Test oversized page or pixel-limit rejection.
- [ ] Test JPEG output.
- [ ] Test PNG output.
- [ ] Test timeout behavior.
- [ ] Test repeated render calls for process or memory leaks.
- [ ] Test platform package resolution.
- [ ] Test typed error codes and safe metadata.
- [ ] Add Linux x64 glibc CI coverage.
- [ ] Add macOS arm64 CI coverage.
- [ ] Add supported Node.js active LTS versions to CI.
- [ ] Add packed-tarball smoke tests to CI.

## Milestone 7: Licensing, Notices, and Supply Chain

Goal: make redistribution and binary provenance explicit.

Exit criteria: every package that ships binaries includes the required notices and release metadata.

- [ ] Include PDFium license text.
- [ ] Include required third-party notices for the bundled PDFium build.
- [ ] Add publish-time check for license and notice files.
- [ ] Document that MIT applies only to project-owned wrapper code.
- [ ] Document bundled PDFium binary licensing in README.
- [ ] Track exact PDFium revision in release metadata.
- [ ] Document whether PDFium binaries are built by this project or imported from a trusted upstream build source.
- [ ] Keep binary build scripts reproducible enough for maintainers to rebuild artifacts.
- [ ] Add dependency and artifact provenance notes to release documentation.

## Milestone 8: Release Automation

Goal: make releases reviewable, repeatable, and tokenless.

Exit criteria: Release Please can prepare releases and GitHub Actions can publish to npm through Trusted Publishing.

- [ ] Add Release Please configuration.
- [ ] Configure release pull requests from Conventional Commits.
- [ ] Configure changelog updates.
- [ ] Configure version updates for wrapper and platform packages.
- [ ] Configure GitHub release creation.
- [ ] Configure npm Trusted Publishing for the wrapper package.
- [ ] Configure npm Trusted Publishing for native platform packages.
- [ ] Add publish workflow dry-run or packed-artifact validation.
- [ ] Publish with provenance if feasible.
- [ ] Document release procedure for maintainers.

## Milestone 9: Public Preview Release

Goal: publish a pre-1.0 package that proves the full operational path.

Exit criteria: a real user can install the package from npm and render a fixture on supported platforms.

- [ ] Complete all Milestone 0-8 required items.
- [ ] Publish first pre-1.0 release.
- [ ] Verify npm install on Linux x64 glibc.
- [ ] Verify npm install on macOS arm64.
- [ ] Verify README quick start works from the published package.
- [ ] Verify unsupported platform error is actionable.
- [ ] Verify license and notice files are present in published package tarballs.
- [ ] Record known limitations in README.
- [ ] Open follow-up issues for deferred platforms and deferred API decisions.

## Milestone 10: 1.0 Release

Goal: declare the public API and platform support stable.

Exit criteria: the package is safe to recommend for supported backend thumbnail rendering use cases.

- [ ] Resolve all MVP open questions from the RFC.
- [ ] Confirm public API stability.
- [ ] Confirm typed error code stability.
- [ ] Confirm Linux x64 glibc support.
- [ ] Confirm macOS arm64 support.
- [ ] Confirm active Node.js LTS support policy.
- [ ] Confirm PDFium update and security response ownership.
- [ ] Confirm packed npm artifacts install and render fixtures on all supported platforms.
- [ ] Confirm README documents supported platforms, limits, licensing, and non-goals.
- [ ] Confirm Release Please produces the 1.0 release pull request.
- [ ] Publish `1.0.0` through npm Trusted Publishing.

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

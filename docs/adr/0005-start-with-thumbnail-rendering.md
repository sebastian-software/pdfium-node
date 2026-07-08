# 0005. Start with selected-page thumbnail rendering

Date: 2026-07-08

## Status

Accepted

## Context

The long-term package may expose more backend-safe PDFium operations, but a broad PDFium binding surface would make pointer ownership, cancellation, API stability, and testing harder to control.

## Decision

The first production capability will be selected-page thumbnail rendering from PDF bytes to JPEG or PNG image bytes.

The public API should be task-oriented. It should not expose raw PDFium document handles, page handles, native pointers, or a one-to-one PDFium API.

The initial API should require callers to explicitly request pages and should not render every page by default.

## Consequences

The MVP stays small enough to validate native rendering, isolation, packaging, and licensing.

Future capabilities can be added as task-level APIs after the thumbnail path proves the operating model.

Users who need a full PDF editor, viewer, text extractor, OCR engine, or raw PDFium binding are outside the initial scope.

# 0007. Isolate rendering in worker processes

Date: 2026-07-08

## Status

Accepted

## Context

PDF files are untrusted input. PDFium can spend significant time inside native code, and JavaScript cancellation mechanisms are not enough to interrupt a native hang reliably.

## Decision

Render work should run outside the caller process.

The JavaScript wrapper should enforce hard timeouts by terminating the worker process and returning typed errors. Native PDFium state should stay out of the main application process.

## Consequences

Timeout behavior can be reliable even when native code is blocked.

Invalid or adversarial PDFs are less likely to crash the caller process.

Rendering has more process overhead, which is acceptable because thumbnail generation is expected to run during upload or background workflows rather than as a hot request-path primitive.

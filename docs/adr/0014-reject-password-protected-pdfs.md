# 0014. Reject password-protected PDF support

Date: 2026-07-09

## Status

Accepted

Supersedes the password-support portion of [0010. Set the MVP package and support baseline](./0010-set-the-mvp-package-and-support-baseline.md).

## Context

ADR 0010 deferred password support after deciding that encrypted PDFs should be rejected in the MVP with typed errors.

The current stable use case is backend thumbnail rendering for PDFs that are already usable by the caller. Password-protected PDFs add API surface, secret-handling rules, test cases for missing, wrong, and correct passwords, and more ways to accidentally expose sensitive data in logs or telemetry.

That complexity does not serve the primary expected workload.

## Decision

`pdfium-node` will not support password-protected PDFs in the stable API.

Callers must not pass passwords to `renderPdfThumbnails`. If they do, the wrapper rejects the request with `PDFIUM_NODE_PASSWORD_REQUIRED`.

Encrypted PDFs that require a password continue to fail with typed errors, such as `PDFIUM_NODE_PASSWORD_REQUIRED` or `PDFIUM_NODE_ENCRYPTED_PDF`, without accepting, logging, or returning password values.

## Consequences

The public rendering API remains focused on already-accessible PDF bytes.

The package avoids password handling, password metadata, and password-specific telemetry risks.

Applications that need password-protected PDF rendering must decrypt documents before calling `pdfium-node` or use a different rendering path for that workflow.

The existing password-related error codes remain available so callers can handle unsupported encrypted input explicitly.

# 0010. Set the MVP package and support baseline

Date: 2026-07-08

## Status

Accepted

## Context

The RFC left several first-release decisions open: final package name, minimum Node.js version, initial platform set, encrypted PDF behavior, and PNG transparency behavior. The milestone plan needs these decisions to make implementation work concrete.

## Decision

The primary npm package name is `@sebastian-software/pdfium-node`.

The minimum supported Node.js version is 22. CI should cover active Node.js LTS release lines, starting with Node.js 22 and 24.

The initial native platform packages are:

- Linux x64 glibc;
- macOS arm64.

Linux arm64, macOS x64, Linux musl, and Windows are deferred until there is concrete user demand and dedicated CI coverage.

Encrypted PDFs are rejected in the MVP with typed errors. Password support is deferred.

MVP rendering flattens output to a white background for both JPEG and PNG. Preserving PNG transparency is deferred until it can be tested consistently across supported platforms.

## Consequences

The first implementation can stay small and testable.

The package name, runtime baseline, and platform package names are stable enough for workspace and release configuration.

Users needing password-protected PDFs, transparent PNG output, or additional platforms will need follow-up releases.

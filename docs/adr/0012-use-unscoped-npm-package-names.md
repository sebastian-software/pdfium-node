# 0012. Use unscoped npm package names

Date: 2026-07-08

## Status

Accepted

Supersedes the package-name decision in [0010. Set the MVP package and support baseline](./0010-set-the-mvp-package-and-support-baseline.md).

## Context

ADR 0010 selected `@sebastian-software/pdfium-node` as the primary npm package name.

The project should still be developed in the `sebastian-software/pdfium-node` GitHub repository, but npm packages should be published as flat, unscoped package names. The `pdfium-node` package name has already been reserved on npm for this project.

## Decision

The primary npm package name is `pdfium-node`.

The initial native platform package names are:

- `pdfium-node-linux-x64-gnu`;
- `pdfium-node-darwin-arm64`.

Future platform package names should keep the same flat `pdfium-node-*` naming pattern, for example `pdfium-node-linux-x64-musl` if musl support is added later.

## Consequences

Consumers install `pdfium-node` directly without an npm scope.

The wrapper package uses unscoped optional dependencies for native platform packages.

Release Please, npm Trusted Publishing, package artifact validation, and documentation must use the unscoped package names.

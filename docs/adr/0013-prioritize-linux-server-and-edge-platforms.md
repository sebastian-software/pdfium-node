# 0013. Prioritize Linux server and edge platforms

Date: 2026-07-08

## Status

Accepted

Supersedes the deferred-platform portion of [0010. Set the MVP package and support baseline](./0010-set-the-mvp-package-and-support-baseline.md).

## Context

The `1.0.0` release supports Linux x64 glibc and macOS arm64. The original MVP decision deferred Linux arm64, Linux musl, macOS x64, and Windows until concrete demand appeared.

The expected deployment model is server-side and edge rendering. That makes Linux arm64 and musl materially more important than macOS Intel support. macOS x64 is also declining as a development target and does not justify a native package without a specific consumer need.

## Decision

Linux arm64 and Linux musl are planned follow-up platform targets.

The planned server and edge platform package candidates are:

- `pdfium-node-linux-arm64-gnu`;
- `pdfium-node-linux-x64-musl`;
- `pdfium-node-linux-arm64-musl`, if the PDFium binary source, build, and CI path are practical.

macOS x64 is not planned. It can be reconsidered only if a concrete user or maintainer need appears with a viable CI and binary packaging path.

Windows remains out of scope until there is concrete demand and a dedicated CI, packaging, and binary validation plan.

## Consequences

The platform roadmap should focus on Linux deployment environments rather than desktop coverage breadth.

The wrapper must continue to fail unsupported platforms with typed, actionable errors until a target has a dedicated package, CI install coverage, render coverage, release packaging, and npm Trusted Publishing setup.

musl support must be treated as a separate target from glibc because libc and dynamic linking behavior affect binary packaging and runtime loading.


# 0006. Use Node-API native bindings

Date: 2026-07-08

## Status

Accepted

## Context

The package needs native bindings that can be distributed as prebuilt binaries across supported Node.js versions and platforms. Plain FFI would make pointer ownership, error handling, deployment behavior, and memory safety more fragile.

## Decision

The project will use Node-API based native bindings.

The recommended starting point is `napi-rs`, unless the native rendering spike shows that integrating PDFium is materially simpler with C++ and `node-addon-api`.

Plain FFI is not part of the first production design.

## Consequences

The native boundary can stay stable across supported Node.js versions.

The binding implementation can change behind the public JavaScript API if needed.

The project still needs platform-specific binary packages and CI coverage for every supported target.

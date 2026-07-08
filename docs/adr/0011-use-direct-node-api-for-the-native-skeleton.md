# 0011. Use direct Node-API for the native skeleton

Date: 2026-07-08

## Status

Accepted

## Context

ADR 0006 selected Node-API based native bindings and recommended starting with `napi-rs` unless the first spike showed that another Node-API path was materially simpler.

The repository now needs a minimal native boundary that can be built and tested without adding dependency or bootstrap weight before PDFium itself is wired in.

## Decision

The initial native skeleton will use direct C Node-API from C++.

This keeps the first native build dependency-free: it uses the Node.js headers already available in the local Node installation and the platform C++ compiler.

`napi-rs` remains a valid future option if it provides clear value once real PDFium integration work starts.

## Consequences

The project can prove native addon loading and worker-process invocation before PDFium is linked.

The first native source is more verbose than a wrapper-based implementation, but the surface is tiny and intentionally isolated.

If the project later switches to `napi-rs` or `node-addon-api`, a new ADR should supersede this one.

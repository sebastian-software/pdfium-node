# 0001. Record architecture decisions

Date: 2026-07-08

## Status

Accepted

## Context

The project will make several decisions that affect public API shape, native packaging, security boundaries, release automation, and long-term maintenance. These decisions should remain discoverable after the initial RFC work is complete.

## Decision

The project will record architectural and product decisions as ADRs under `docs/adr/`.

ADRs are immutable decision records. Accepted ADRs should not be rewritten to reflect later thinking. If a decision changes, a new ADR must supersede the older one and link to it.

Each ADR should use the classic structure:

- title;
- status;
- context;
- decision;
- consequences.

## Consequences

Decision history stays explicit and reviewable.

Changing a prior decision requires a new ADR instead of editing history.

The repository needs an initial set of ADRs for decisions already made in the RFC.

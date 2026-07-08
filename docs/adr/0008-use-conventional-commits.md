# 0008. Use Conventional Commits

Date: 2026-07-08

## Status

Accepted

## Context

The project needs a commit history that is readable to contributors and usable by release automation.

## Decision

The project will use Conventional Commits.

Commit messages should use Conventional Commit types and scopes where useful, for example `feat:`, `fix:`, `docs:`, `build:`, `ci:`, and `chore:`.

## Consequences

Commit history communicates intent consistently.

Release automation can derive changelog entries and version bumps from commits.

Contributors need guidance in the README or contributing documentation before the first public release.

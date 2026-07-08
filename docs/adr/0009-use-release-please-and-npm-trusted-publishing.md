# 0009. Use Release Please and npm Trusted Publishing

Date: 2026-07-08

## Status

Accepted

## Context

The project will publish JavaScript and native platform packages to npm. Releases should not depend on manual changelog edits, manual version bumps, or long-lived npm automation tokens.

## Decision

The project will use Release Please for release pull requests, changelog updates, version bumps, and GitHub releases based on Conventional Commits.

npm packages will be published from GitHub Actions using npm Trusted Publishing.

## Consequences

Release changes stay reviewable through release pull requests.

Publishing can use GitHub Actions identity instead of storing a long-lived npm token.

The release workflow must account for the wrapper package and all native platform packages.

# Contributing

The project language is English. Use English for issues, pull requests, documentation, code comments, commits, and release notes.

## Development Principles

- Keep the public API task-oriented.
- Do not expose raw PDFium handles or native pointers to userland.
- Treat PDF input as untrusted.
- Prefer small, reviewable changes.
- Record durable architecture and product decisions as ADRs under `docs/adr/`.
- Do not rewrite accepted ADRs. Supersede them with a new ADR when a decision changes.

## Commits

Use Conventional Commits:

```text
feat: add thumbnail rendering API
fix: normalize timeout errors
docs: add platform support notes
build: configure release please
ci: add packed package smoke test
```

Use scopes when they clarify ownership:

```text
feat(native): render first page bitmap
test(wrapper): cover missing platform package errors
```

## Checks

Before opening a pull request, run the repository verification command documented in `package.json`.

Until the implementation is complete, documentation-only changes should at least pass:

```sh
git diff --check
```

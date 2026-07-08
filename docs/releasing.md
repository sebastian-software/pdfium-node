# Releasing

Releases are managed with Release Please and npm Trusted Publishing.

## Release Flow

1. Merge feature, fix, docs, build, and CI changes to `main` using Conventional Commits.
2. Release Please opens or updates a release pull request.
3. Review the release pull request for version bumps, changelog entries, and package coverage.
4. Merge the release pull request.
5. Release Please creates the GitHub release.
6. The publish workflow publishes npm packages from GitHub Actions using Trusted Publishing.

## Preview Release

The first public preview release is forced to `0.1.0` through `release-as` in `release-please-config.json`. Remove that override after the preview release pull request is merged, otherwise later release pull requests will continue to target the same version.

## Packages

The release configuration covers:

- `@sebastian-software/pdfium-node`
- `@sebastian-software/pdfium-node-darwin-arm64`
- `@sebastian-software/pdfium-node-linux-x64-gnu`

## Local Validation

Run the full repository gate before release:

```sh
npm run qa
```

The QA gate includes:

- lint and formatting checks;
- TypeScript configuration checks;
- Node test runner;
- documentation checks;
- package manifest checks;
- Release Please configuration checks;
- packed npm artifact validation.

## Trusted Publishing Setup

npm Trusted Publishing must be configured in npm for every published package before the first real release. The GitHub Actions workflow requests `id-token: write` and publishes with `--provenance`.

Do not add long-lived npm tokens to repository secrets.

Trusted publisher setup can be managed with the npm CLI once the packages exist on the registry:

```sh
npm trust github @sebastian-software/pdfium-node --repo sebastian-software/pdfium-node --file publish.yml
npm trust github @sebastian-software/pdfium-node-darwin-arm64 --repo sebastian-software/pdfium-node --file publish.yml
npm trust github @sebastian-software/pdfium-node-linux-x64-gnu --repo sebastian-software/pdfium-node --file publish.yml
```

The native packages must be created from builds that include their platform prebuilds. Do not bootstrap a platform package from the wrong operating system just to create the npm package name.

## Binary Notices

Every native package must include `THIRD_PARTY_NOTICES.md`. Once PDFium binaries are bundled, the notice files must include the required PDFium and third-party notices before publishing.

The upstream PDFium license is tracked at `third_party/pdfium/LICENSE`. Binary releases must also record the exact PDFium revision and build source.

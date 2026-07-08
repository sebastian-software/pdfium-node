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

Release Please uses the `node-workspace` plugin so local workspace dependency versions stay aligned across the wrapper and native platform packages.

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

## Package Artifact Validation

Before publishing a preview or stable release, build the exact npm tarballs from the release branch on the supported operating systems:

```sh
gh workflow run package-artifacts.yml --ref main -f ref=release-please--branches--main
```

Download and inspect the uploaded `npm-tarballs-*` artifacts before merging the release pull request if the release changes packaging, native linking, or bundled binary contents.

## Trusted Publishing Setup

npm Trusted Publishing must be configured in npm for every published package before the first real release. The GitHub Actions workflow requests `id-token: write` and publishes with `--provenance`.

Do not add long-lived npm tokens to repository secrets.

Trusted publisher setup can be managed with the npm CLI once the packages exist on the registry. The npm CLI requires an npm owner account with two-factor authentication for this operation:

```sh
npm trust github @sebastian-software/pdfium-node --repo sebastian-software/pdfium-node --file publish.yml --yes
npm trust github @sebastian-software/pdfium-node-darwin-arm64 --repo sebastian-software/pdfium-node --file publish.yml --yes
npm trust github @sebastian-software/pdfium-node-linux-x64-gnu --repo sebastian-software/pdfium-node --file publish.yml --yes
```

For brand-new package names, npm currently requires the package record to exist before trust can be configured. Bootstrap those package records from the exact tarballs produced by the Package Artifacts workflow, then configure trust and use the GitHub Actions publish workflow for subsequent releases.

The native packages must be created from builds that include their platform prebuilds. Do not bootstrap a platform package from the wrong operating system just to create the npm package name.

## Binary Notices

Every native package must include `THIRD_PARTY_NOTICES.md`. Once PDFium binaries are bundled, the notice files must include the required PDFium and third-party notices before publishing.

The upstream PDFium license is tracked at `third_party/pdfium/LICENSE`. Binary releases must also record the exact PDFium revision and build source.

## PDFium Updates

Maintainers in `sebastian-software/pdfium-node` own PDFium revision updates and security-response releases.

When changing the bundled PDFium revision:

1. Update `scripts/build-native.mjs` to the new pinned source.
2. Rebuild and measure the native package on supported platforms.
3. Update `third_party/pdfium/README.md` and `docs/native-measurements.md`.
4. Verify `npm run qa` and the Package Artifacts workflow.
5. Inspect native package tarballs for `PDFIUM_VERSION`, `libpdfium`, `pdfium_node_native.node`, `THIRD_PARTY_NOTICES.md`, and the copied license directory.
6. Include the PDFium revision change in the release notes.

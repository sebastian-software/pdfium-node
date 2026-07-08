# Native Build

The current native implementation is a dependency-free Node-API addon that links PDFium on supported build targets.

It proves that platform packages can load a native `.node` addon, render through PDFium, encode PNG/JPEG thumbnails, and call through the worker process.

## Current Status

- Binding approach: direct C Node-API from C++.
- Implemented targets: `darwin-arm64`, `linux-x64-gnu`.
- Locally verified target in this workspace: `darwin-arm64`.
- PDFium linked: yes on supported native build targets.
- Rendering: PNG and JPEG output on supported native build targets.
- PDFium license reference: `third_party/pdfium/LICENSE`.
- PDFium binary source: `bblanchon/pdfium-binaries`, pinned to `chromium/7934`.

## Build

```sh
npm run build:native
```

On `darwin-arm64`, this builds:

```text
packages/pdfium-node-darwin-arm64/prebuilds/darwin-arm64/pdfium_node_native.node
```

On `linux-x64`, this builds:

```text
packages/pdfium-node-linux-x64-gnu/prebuilds/linux-x64-gnu/pdfium_node_native.node
```

Other platforms currently skip the native build until their platform build is implemented.

## Verification

```sh
npm run qa
```

The QA gate builds the native addon, loads it through the platform package, runs API tests through the worker process, validates packed package contents, and installs the packed tarballs in a clean temporary project.

## Measurements

```sh
npm run measure:native
```

The latest checked-in measurement is recorded in `docs/native-measurements.md`.

## Next Step

The next native milestone is proving the published npm install path on Linux x64 glibc and macOS arm64 after the first preview release is bootstrapped.

# Native Build

The current native implementation is a dependency-free Node-API skeleton.

It proves that platform packages can load a native `.node` addon, link PDFium, and call through the worker process.

## Current Status

- Binding approach: direct C Node-API from C++.
- Implemented targets: `darwin-arm64`, `linux-x64-gnu`.
- Locally verified target in this workspace: `darwin-arm64`.
- PDFium linked: yes on supported native build targets.
- Rendering: PNG output on supported native build targets; JPEG output pending.
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

The QA gate builds the native skeleton, loads it through the platform package, runs API tests through the worker process, validates packed package contents, and installs the packed tarballs in a clean temporary project.

## Next Step

The next native milestone is adding JPEG encoding and implementing the Linux x64 glibc native build.

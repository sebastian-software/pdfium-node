# Native Build

The current native implementation is a dependency-free Node-API skeleton.

It proves that platform packages can load a native `.node` addon, link PDFium, and call through the worker process.

## Current Status

- Binding approach: direct C Node-API from C++.
- Local implemented target: `darwin-arm64`.
- Linux x64 package target: package placeholder, native build still pending.
- PDFium linked: yes on `darwin-arm64`.
- Rendering: PNG output on `darwin-arm64`; JPEG output pending.
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

Other platforms currently skip the native build until their platform build is implemented.

## Verification

```sh
npm run qa
```

The QA gate builds the native skeleton, loads it through the platform package, runs API tests through the worker process, validates packed package contents, and installs the packed tarballs in a clean temporary project.

## Next Step

The next native milestone is adding JPEG encoding and implementing the Linux x64 glibc native build.

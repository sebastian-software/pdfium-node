# Native Build

The current native implementation is a dependency-free Node-API skeleton.

It proves that platform packages can load a native `.node` addon and call through the worker process. It does not link PDFium yet and does not render PDF pages yet.

## Current Status

- Binding approach: direct C Node-API from C++.
- Local implemented target: `darwin-arm64`.
- Linux x64 package target: package placeholder, native build still pending.
- PDFium linked: no.
- Rendering: not implemented.
- PDFium license reference: `third_party/pdfium/LICENSE`.

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

The next native milestone is linking a known PDFium build, recording its exact upstream revision, adding complete third-party notices, and replacing the skeleton error with real page rendering.

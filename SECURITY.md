# Security Policy

PDF input must be treated as untrusted.

## Reporting a Vulnerability

Please report security vulnerabilities privately through GitHub security advisories once the repository is public.

Do not open public issues for vulnerabilities that may expose users to risk.

## Scope

Security reports may cover:

- malformed PDF crashes;
- timeout bypasses;
- worker process escape or orphaning;
- unsafe temporary file behavior;
- bundled PDFium binary or notice issues;
- package publishing or provenance issues.

## Maintenance Expectations

The maintainers of `sebastian-software/pdfium-node` own the PDFium update cadence, security response, release notes, and binary notice verification.

The project tracks the exact PDFium revision used for each release. PDFium security updates should be handled as patch or minor releases depending on API impact.

Security-sensitive dependency or PDFium updates should include:

- the new PDFium revision and build source;
- a fixture render check on every supported platform;
- packed npm artifact validation;
- license and third-party notice verification for native packages;
- a changelog entry when bundled binary contents change.

Before `1.0.0`, security-sensitive behavior may still change while the package hardens its rendering and packaging model.

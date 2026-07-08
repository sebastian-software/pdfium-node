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

The project tracks the exact PDFium revision used for each release. PDFium security updates should be handled as patch or minor releases depending on API impact.

Before `1.0.0`, security-sensitive behavior may still change while the package hardens its rendering and packaging model.

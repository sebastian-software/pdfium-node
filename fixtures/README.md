# Fixtures

Fixtures in this directory must be legally redistributable.

Prefer small, clean-room PDFs generated specifically for this repository. Do not add customer documents, production uploads, copyrighted third-party PDFs, or files copied from test suites with unclear redistribution terms.

## Current Fixtures

- `simple-one-page.pdf`: hand-written minimal one-page PDF used for smoke tests and future rendering tests.
- `multi-page.pdf`: generated two-page vector PDF for page selection and ordering tests.
- `image-heavy.pdf`: generated PDF with an embedded RGB image XObject.
- `encrypted.pdf`: generated encrypted PDF with user password `user`, used to test the MVP rejection path.

Regenerate fixtures with:

```sh
node scripts/generate-fixtures.mjs
```

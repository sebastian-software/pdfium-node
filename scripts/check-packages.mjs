import { fail, fileExists, readJson } from "./lib/repo.mjs";

const rootPackage = await readJson("package.json");

if (rootPackage.private !== true) {
  fail("Root package.json must remain private");
}

if (!rootPackage.workspaces?.includes("packages/*")) {
  fail("Root package.json must include packages/* workspaces");
}

if (rootPackage.engines?.node !== ">=22") {
  fail("Root package.json must require Node >=22");
}

const plannedPackages = [
  "packages/pdfium-node",
  "packages/pdfium-node-linux-x64-gnu",
  "packages/pdfium-node-darwin-arm64",
];

for (const directory of plannedPackages) {
  if (!(await fileExists(`${directory}/package.json`))) {
    fail(`Missing planned package manifest: ${directory}/package.json`);
  }

  if (!(await fileExists(`${directory}/README.md`))) {
    fail(`Missing package README: ${directory}/README.md`);
  }

  if (!(await fileExists(`${directory}/LICENSE`))) {
    fail(`Missing package license: ${directory}/LICENSE`);
  }
}

for (const directory of plannedPackages.slice(1)) {
  if (!(await fileExists(`${directory}/THIRD_PARTY_NOTICES.md`))) {
    fail(`Missing native package notices: ${directory}/THIRD_PARTY_NOTICES.md`);
  }
}

if (!(await fileExists("packages/pdfium-node/src/index.d.ts"))) {
  fail("Wrapper package must publish TypeScript declarations");
}

if (!(await fileExists("third_party/pdfium/LICENSE"))) {
  fail("Missing PDFium license reference: third_party/pdfium/LICENSE");
}

if (!(await fileExists("third_party/pdfium/README.md"))) {
  fail("Missing PDFium provenance notes: third_party/pdfium/README.md");
}

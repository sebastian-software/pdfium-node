import { readFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import { fail, fileExists, listFiles, root } from "./lib/repo.mjs";

const requiredFiles = [
  "README.md",
  "LICENSE",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "docs/milestones.md",
  "docs/adr/README.md",
  "pdfium-thumbnail-renderer-rfc.md",
];

for (const file of requiredFiles) {
  if (!(await fileExists(file))) {
    fail(`Missing required documentation file: ${file}`);
  }
}

const adrFiles = (await listFiles("docs/adr")).filter((file) =>
  /^docs\/adr\/\d{4}-.+\.md$/.test(file)
);

const adrIndex = await readFile(join(root, "docs/adr/README.md"), "utf8");
for (const file of adrFiles) {
  const relativeLink = `./${file.slice("docs/adr/".length)}`;
  if (!adrIndex.includes(relativeLink)) {
    fail(`docs/adr/README.md does not link ${file}`);
  }
}

const markdownFiles = (await listFiles()).filter((file) => file.endsWith(".md"));
const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

for (const file of markdownFiles) {
  const text = await readFile(join(root, file), "utf8");
  for (const match of text.matchAll(markdownLinkPattern)) {
    const target = match[1];
    if (/^[a-z]+:/.test(target) || target.startsWith("#")) {
      continue;
    }

    const targetPath = normalize(join(root, dirname(file), target.split("#")[0]));
    if (!targetPath.startsWith(root)) {
      fail(`${file}: link escapes repository: ${target}`);
      continue;
    }

    const relativePath = targetPath.slice(root.length);
    if (relativePath && !(await fileExists(relativePath))) {
      fail(`${file}: broken link: ${target}`);
    }
  }
}

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, listFiles, root } from "./lib/repo.mjs";

const textExtensions = new Set([
  ".cjs",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".yml",
]);

const textFiles = (await listFiles()).filter((file) => {
  const dot = file.lastIndexOf(".");
  return dot !== -1 && textExtensions.has(file.slice(dot));
});

for (const file of textFiles) {
  const text = await readFile(join(root, file), "utf8");

  if (!text.endsWith("\n")) {
    fail(`${file}: missing final newline`);
  }

  const lines = text.split("\n");
  lines.forEach((line, index) => {
    if (/[ \t]$/.test(line)) {
      fail(`${file}:${index + 1}: trailing whitespace`);
    }
  });
}

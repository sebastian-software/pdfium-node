import { mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { root } from "./lib/repo.mjs";

const execFileAsync = promisify(execFile);

const nodeIncludeDirectory = process.config.variables.nodedir
  ? join(process.config.variables.nodedir, "include", "node")
  : join(dirname(process.execPath), "..", "include", "node");

const currentTarget = `${process.platform}-${process.arch}`;

if (currentTarget !== "darwin-arm64") {
  console.log(`No native skeleton build configured for ${currentTarget}; skipping.`);
  process.exit(0);
}

const packageDirectory = join(root, "packages/pdfium-node-darwin-arm64");
const outputDirectory = join(packageDirectory, "prebuilds/darwin-arm64");
const source = join(packageDirectory, "src/native.cc");
const output = join(outputDirectory, "pdfium_node_native.node");

await mkdir(outputDirectory, { recursive: true });

await execFileAsync("c++", [
  "-std=c++17",
  "-shared",
  "-undefined",
  "dynamic_lookup",
  "-I",
  nodeIncludeDirectory,
  source,
  "-o",
  output,
]);

console.log(`Built ${output}`);

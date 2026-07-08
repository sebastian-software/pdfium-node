import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";

export const root = new URL("../../", import.meta.url).pathname;

const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
]);

export async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), "utf8"));
}

export async function fileExists(path) {
  try {
    const info = await stat(join(root, path));
    return info.isFile();
  } catch {
    return false;
  }
}

export async function listFiles(directory = ".") {
  const base = join(root, directory);
  const files = [];

  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
        continue;
      }

      const absolute = join(current, entry.name);

      if (entry.isDirectory()) {
        await walk(absolute);
        continue;
      }

      if (entry.isFile()) {
        files.push(relative(root, absolute).split(sep).join("/"));
      }
    }
  }

  await walk(base);
  return files.sort();
}

export function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

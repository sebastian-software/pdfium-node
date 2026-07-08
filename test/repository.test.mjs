import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileExists, readJson } from "../scripts/lib/repo.mjs";

describe("repository baseline", () => {
  it("keeps the root package private", async () => {
    const manifest = await readJson("package.json");
    assert.equal(manifest.private, true);
  });

  it("documents the milestone plan", async () => {
    assert.equal(await fileExists("docs/milestones.md"), true);
  });
});

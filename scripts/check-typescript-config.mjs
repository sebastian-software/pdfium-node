import { fail, fileExists, readJson } from "./lib/repo.mjs";

if (!(await fileExists("tsconfig.base.json"))) {
  fail("Missing tsconfig.base.json");
}

if (!(await fileExists("tsconfig.json"))) {
  fail("Missing tsconfig.json");
}

const base = await readJson("tsconfig.base.json");
const root = await readJson("tsconfig.json");

if (root.extends !== "./tsconfig.base.json") {
  fail("tsconfig.json must extend ./tsconfig.base.json");
}

if (base.compilerOptions?.module !== "NodeNext") {
  fail("tsconfig.base.json must use NodeNext modules");
}

if (base.compilerOptions?.strict !== true) {
  fail("tsconfig.base.json must enable strict mode");
}

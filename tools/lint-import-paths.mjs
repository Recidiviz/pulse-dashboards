import { readFileSync } from "fs";
import { join } from "path";

const tsconfig = JSON.parse(
  readFileSync(
    join(new URL(".", import.meta.url).pathname, "../tsconfig.base.json"),
  ).toString(),
);

const invalidImportPaths = Object.keys(tsconfig.compilerOptions.paths).filter(
  (path) => !path.startsWith("~"),
);

if (invalidImportPaths.length) {
  console.error(
    `Invalid import paths: ${invalidImportPaths.join(", ")}. All paths must start with ~`,
  );
  process.exitCode = 1;
}

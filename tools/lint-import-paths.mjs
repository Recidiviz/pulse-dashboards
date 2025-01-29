import { readFileSync } from "fs";
import { join } from "path";

const tsconfig = JSON.parse(
  readFileSync(
    join(new URL(".", import.meta.url).pathname, "../tsconfig.base.json"),
  ).toString(),
);

// Allowlist the paths for the custom prisma clients
const invalidImportPaths = Object.keys(tsconfig.compilerOptions.paths).filter(
  (path) => !path.startsWith("~") && !path.startsWith("@prisma"),
);

if (invalidImportPaths.length) {
  console.error(
    `Invalid import paths: ${invalidImportPaths.join(", ")}. All paths must start with ~`,
  );
  process.exitCode = 1;
}

// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

// Fails when the built bundle requires a package `runtime/package.json` does
// not declare.
//
// The Cloud Functions builder runs `npm install` server-side against that file
// alone, so an undeclared package is simply absent at runtime. The failure is quiet
// So this verification is run before deploy.

import { existsSync, readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Paths come from the caller, because both @typesense Cloud Functions need
// this check and they differ only in where they live. nx runs each target with
// `cwd` set to its own project root.
const arg = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(here, "..", "..", "..", "..");

const project = arg("project");
if (!project) {
  console.error(
    "usage: verifyRuntimeDeps.mts --project=<name under apps/@typesense>",
  );
  process.exit(2);
}

const bundle = join(workspaceRoot, `dist/apps/@typesense/${project}/index.cjs`);
const manifest = join(
  workspaceRoot,
  `apps/@typesense/${project}/runtime/package.json`,
);

if (!existsSync(bundle)) {
  console.error(`No bundle at ${bundle}. Run \`nx build\` first.`);
  process.exit(1);
}

// A bare `require("x")` or `require("@scope/x")`. A relative or absolute path
// is bundled code, not a dependency, so it is skipped.
const REQUIRE = /require\(\s*["'](@?[^"'./][^"']*)["']\s*\)/g;

const source = readFileSync(bundle, "utf8");
const required = new Set<string>();
for (const [, specifier] of source.matchAll(REQUIRE)) {
  // `lodash/pick` is satisfied by a `lodash` dependency.
  const pkg = specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : specifier.split("/")[0];
  required.add(pkg);
}

const builtins = new Set([
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
]);
const declared = new Set(
  Object.keys(
    (
      JSON.parse(readFileSync(manifest, "utf8")) as {
        dependencies?: Record<string, string>;
      }
    ).dependencies ?? {},
  ),
);

const missing = [...required]
  .filter((pkg) => !builtins.has(pkg) && !declared.has(pkg))
  .sort();

if (missing.length > 0) {
  console.error(
    `\n✗ The bundle requires ${missing.length} package(s) that ` +
      `runtime/package.json does not declare:\n`,
  );
  for (const pkg of missing) console.error(`    ${pkg}`);
  console.error(
    `\n  The Cloud Functions builder installs from that file only, so these ` +
      `\n  are absent at runtime and the container will not start. Add them ` +
      `\n  there, or mark them bundled rather than external.\n`,
  );
  process.exit(1);
}

console.info(
  `✓ every package the bundle requires is declared ` +
    `(${[...required]
      .filter((p) => !builtins.has(p))
      .sort()
      .join(", ")})`,
);

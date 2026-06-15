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

import { readFile } from "node:fs/promises";

import type { StorybookConfig } from "@storybook/react-vite";
import { loadCsf } from "storybook/internal/csf-tools";
import { mergeConfig } from "vite";
import macros from "vite-plugin-babel-macros";
import svgr from "vite-plugin-svgr";

// Build the `stories` glob list from CLI-scoped paths.
//
// Invoking `nx examples staff` (or `nx build-examples staff`) sets the
// EXAMPLES_PATHS env var to whatever positional args the user passed. Each
// entry can be either a directory (relative to the staff project root) or a
// single .{ts,tsx,js,jsx} file. When EXAMPLES_PATHS is unset/empty we fall
// back to scanning the entire `src/` tree, which is the project's default
// "root of the project" scan.
function buildGlobsFor(input: string): string[] {
  // Single file: pass it through verbatim (relative to .examples/).
  if (/\.(?:[jt]sx?)$/.test(input)) return [`../${input}`];
  // Directory: emit the colocated + dir-form globs scoped to it.
  return [
    `../${input}/**/*.examples.@(js|jsx|ts|tsx)`,
    `../${input}/**/examples/*.@(js|jsx|ts|tsx)`,
  ];
}

const rawExamplesPaths = process.env.EXAMPLES_PATHS?.trim();
// Split on whitespace or commas so both `nx examples staff a b` (positional)
// and `EXAMPLES_PATHS="a,b"` work without surprises.
const userPaths = rawExamplesPaths
  ? rawExamplesPaths.split(/[\s,]+/).filter(Boolean)
  : ["src"];

const config = {
  stories: userPaths.flatMap(buildGlobsFor),
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // The default Storybook CSF indexer only matches `*.stories.*`. Register a
  // parallel indexer that runs the same CSF parser on `*.examples.*` files so
  // we can keep our convention (named-export components, no Meta/StoryObj
  // wrappers beyond the required `export default {}` stub). This indexer is
  // appended to Storybook's defaults rather than replacing them, so traditional
  // CSF stories from a separate config (e.g. a future `.storybook/`) coexist
  // without conflict.
  experimental_indexers: async (existing) => [
    {
      test: /\.examples\.(j|t)sx?$/,
      createIndex: async (fileName, options) => {
        const code = await readFile(fileName, "utf-8");
        // Wrap Storybook's makeTitle so the auto-derived sidebar title drops
        // the `.examples` suffix (e.g. "components/Loading.examples" -> "components/Loading").
        const makeTitle = (userTitle: string) =>
          options.makeTitle(userTitle).replace(/\.examples$/, "");
        return loadCsf(code, { ...options, makeTitle, fileName }).parse()
          .indexInputs;
      },
    },
    ...(existing ?? []),
  ],
  viteFinal: async (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [macros(), svgr()],
    }),
} satisfies StorybookConfig;

export default config;

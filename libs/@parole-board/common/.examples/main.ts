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
import { basename, relative, resolve } from "node:path";

import type { StorybookConfig } from "@storybook/react-vite";
import react from "@vitejs/plugin-react";
import { loadCsf } from "storybook/internal/csf-tools";
import type { StoriesSpecifier } from "storybook/internal/types";
import { mergeConfig, type PluginOption } from "vite";

// The examples config every Parole Board library shares. A library opts in
// with `examples` and `build-examples` targets that run Storybook with
// `--config-dir ../common/.examples` from the library's own folder (see
// common's project.json), so a new state library copies two targets and no
// config. Storybook runs with the library folder as its cwd, which is how
// this file knows whose examples to scan.
const libraryRoot = process.cwd();
const configDir = resolve(libraryRoot, "../common/.examples");

// Paths come from the nx args and are relative to the library root, so
// `nx examples @parole-board/us-co src/MonthHeader` scans
// libs/@parole-board/us-co/src/MonthHeader. Each is a directory or a single
// .{ts,tsx,js,jsx} file. Every specifier is rooted at the library and
// prefixed with its folder name, so a story's title, and so its id, is
// `us-co/src/AdminRootContent` whatever the scope. The prefix also tells one
// library's server apart from another's in index.json.
function buildSpecifiersFor(input: string): StoriesSpecifier[] {
  const directory = relative(configDir, libraryRoot) || ".";
  const titlePrefix = basename(libraryRoot);
  if (/\.(?:[jt]sx?)$/.test(input)) {
    return [{ directory, files: input, titlePrefix }];
  }
  return [
    {
      directory,
      files: `${input}/**/*.examples.@(js|jsx|ts|tsx)`,
      titlePrefix,
    },
    {
      directory,
      files: `${input}/**/examples/*.@(js|jsx|ts|tsx)`,
      titlePrefix,
    },
  ];
}

const rawExamplesPaths = process.env["EXAMPLES_PATHS"]?.trim();
// Split on whitespace or commas so both positional args and
// `EXAMPLES_PATHS="a,b"` work. With no paths, scan the library's src.
const userPaths = rawExamplesPaths
  ? rawExamplesPaths.split(/[\s,]+/).filter(Boolean)
  : ["src"];

// Storybook loads common's vite.config.mts, because it treats the config
// dir's parent as the project root. Its React plugin is replaced below, so
// drop it here rather than run two.
function withoutReactPlugin(plugins: PluginOption[] = []): PluginOption[] {
  return plugins
    .flat(Infinity as 1)
    .filter(
      (plugin) =>
        !(plugin && "name" in plugin && plugin.name.startsWith("vite:react")),
    );
}

const config = {
  stories: userPaths.flatMap(buildSpecifiersFor),
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // Storybook's default indexer only matches `*.stories.*`. This one runs the
  // same CSF parser on `*.examples.*` files and drops the `.examples` suffix
  // from the derived title, so story ids match the staff renderer's.
  experimental_indexers: async (existing) => [
    {
      test: /\.examples\.(j|t)sx?$/,
      createIndex: async (fileName, options) => {
        const code = await readFile(fileName, "utf-8");
        const makeTitle = (userTitle: string) =>
          options.makeTitle(userTitle).replace(/\.examples$/, "");
        return loadCsf(code, { ...options, makeTitle, fileName }).parse()
          .indexInputs;
      },
    },
    ...(existing ?? []),
  ],
  // This is the only build that runs the react-magnetic-di Babel plugin,
  // which wraps each function's imported dependencies so examples can inject
  // replacements (D29). The library builds, Vitest and the staff build never
  // load this file, so production code has no DI wrapping. The plugin skips
  // production by default, and `nx build-examples` runs as production, so
  // enabledEnvs lists it. A library that imports SVGs as components needs
  // svgr() here, as in the staff config.
  viteFinal: async (viteConfig) =>
    mergeConfig(
      { ...viteConfig, plugins: withoutReactPlugin(viteConfig.plugins) },
      {
        plugins: [
          react({
            babel: {
              plugins: [
                "babel-plugin-styled-components",
                [
                  "react-magnetic-di/babel-plugin",
                  { enabledEnvs: ["development", "test", "production"] },
                ],
              ],
            },
          }),
        ],
      },
    ),
} satisfies StorybookConfig;

export default config;

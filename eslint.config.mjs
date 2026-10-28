// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

// @ts-check
import nxPlugin from "@nx/eslint-plugin";
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginMobx from "eslint-plugin-mobx";
import eslintPluginNotice from "eslint-plugin-notice";
import eslintPluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import eslintPluginVitest from "eslint-plugin-vitest";
import eslintPluginYml from "eslint-plugin-yml";
import jsoncEslintParser from "jsonc-eslint-parser";
import tseslint from "typescript-eslint";

export const TYPE_TAGS = {
  util: "type:util",
  ui: "type:ui",
  feature: "type:feature",
  state: "type:state",
  app: "type:app",
};

const TEST_FILES = [
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/*.test.js",
  "**/*.test.jsx",
];

const MAGNETIC_DI_RESTRICTION = {
  name: "react-magnetic-di",
  message: "react-magnetic-di is for examples only (D29).",
};

const PAROLE_BOARD_FIXTURES_RESTRICTION = {
  name: "~@parole-board/common/fixtures",
  message:
    "Parole Board fixtures are for tests and examples only; they import Storybook.",
};

const PAROLE_BOARD_TESTING_RESTRICTION = {
  name: "~@parole-board/common/testing",
  message: "Parole Board test helpers are for tests and examples only.",
};

export default tseslint.config(
  {
    ignores: [
      "**/dist",
      // Static builds from `nx build-examples`.
      "**/examples-static",
      "vite.config.mts.timestamp-*",
      "**/.next/**",
      "**/next-env.d.ts",
      // Python virtualenvs contain vendored JS that should never be linted.
      "**/.venv/**",
      // Python backend — generated data fixtures/examples are BigQuery-style
      // newline-delimited JSON that the jsonc parser cannot read.
      "apps/@reentry/backend/data/**",
    ],
  },
  {
    plugins: {
      "@nx": nxPlugin,
      "simple-import-sort": eslintPluginSimpleImportSort,
      notice: eslintPluginNotice,
      yml: eslintPluginYml,
    },
  },
  {
    files: ["**/*.json"],
    languageOptions: {
      parser: jsoncEslintParser,
    },
  },
  nxPlugin.configs["flat/javascript"],
  nxPlugin.configs["flat/typescript"],
  {
    files: ["**/*.*ts", "**/*.*tsx", "**/*.*js", "**/*.*jsx"],
    rules: {
      "array-callback-return": [
        "warn",
        {
          allowImplicit: true,
        },
      ],
      "notice/notice": [
        "error",
        {
          template:
            "// Recidiviz - a data platform for criminal justice reform\n// Copyright (C) <%= YEAR %> Recidiviz, Inc.\n//\n// This program is free software: you can redistribute it and/or modify\n// it under the terms of the GNU General Public License as published by\n// the Free Software Foundation, either version 3 of the License, or\n// (at your option) any later version.\n//\n// This program is distributed in the hope that it will be useful,\n// but WITHOUT ANY WARRANTY; without even the implied warranty of\n// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n// GNU General Public License for more details.\n//\n// You should have received a copy of the GNU General Public License\n// along with this program.  If not, see <https://www.gnu.org/licenses/>.\n// =============================================================================\n\n",
        },
      ],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "no-await-in-loop": "error",
      "no-nested-ternary": "error",
      "no-use-before-define": "error",
      "no-useless-constructor": "off",
      "@typescript-eslint/no-useless-constructor": "error",
    },
  },
  {
    files: ["**/*.*ts", "**/*.*tsx", "**/*.*js", "**/*.*jsx"],
    ignores: ["**/eslint.config.mjs"],
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          allowCircularSelfDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: "scope:client",
              onlyDependOnLibsWithTags: ["scope:client", "scope:universal"],
            },
            {
              sourceTag: "scope:server",
              onlyDependOnLibsWithTags: ["scope:server", "scope:universal"],
            },
            {
              sourceTag: "scope:universal",
              onlyDependOnLibsWithTags: ["scope:universal"],
            },
            {
              sourceTag: TYPE_TAGS.util,
              onlyDependOnLibsWithTags: [TYPE_TAGS.util],
            },
            {
              sourceTag: TYPE_TAGS.ui,
              onlyDependOnLibsWithTags: [TYPE_TAGS.util, TYPE_TAGS.ui],
            },
            {
              sourceTag: TYPE_TAGS.feature,
              onlyDependOnLibsWithTags: [
                TYPE_TAGS.util,
                TYPE_TAGS.ui,
                TYPE_TAGS.feature,
              ],
            },
            {
              sourceTag: TYPE_TAGS.state,
              onlyDependOnLibsWithTags: [
                TYPE_TAGS.util,
                TYPE_TAGS.ui,
                TYPE_TAGS.feature,
              ],
            },
            {
              sourceTag: TYPE_TAGS.app,
              onlyDependOnLibsWithTags: [
                TYPE_TAGS.util,
                TYPE_TAGS.ui,
                TYPE_TAGS.feature,
                TYPE_TAGS.state,
              ],
            },
            // The generic calendar never depends on a product that uses it.
            {
              sourceTag: "domain:calendar",
              notDependOnLibsWithTags: ["domain:parole-board"],
            },
            // Shared Parole Board code never depends on a state's library.
            {
              sourceTag: "parole-board:common",
              notDependOnLibsWithTags: ["parole-board:state"],
            },
            // A state's library never depends on another state's library.
            {
              sourceTag: "parole-board:state",
              notDependOnLibsWithTags: ["parole-board:state"],
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.test.js", "**/*.test.jsx"],
    extends: [eslintPluginVitest.configs.recommended],
    rules: {
      "vitest/expect-expect": [
        "error",
        { assertFunctionNames: ["expect", "expectTypeOf"] },
      ],
    },
  },
  // react-magnetic-di is for examples only (D29). Its Babel plugin runs only in
  // the Parole Board examples build, so `injectable` anywhere else would do
  // nothing, and the package must never reach a production bundle. This uses
  // the typescript-eslint copy of the rule because several app configs set
  // their own no-restricted-imports, which would replace this one. The
  // Parole Board fixtures are synthetic data and import Storybook, and the
  // Parole Board test helpers wrap Testing Library, so tests and example files
  // may use them but production code may not.
  {
    files: ["**/*.*ts", "**/*.*tsx", "**/*.*js", "**/*.*jsx"],
    ignores: [
      "**/*.examples.tsx",
      "**/examples/*.tsx",
      "**/.examples/**",
      ...TEST_FILES,
    ],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            MAGNETIC_DI_RESTRICTION,
            PAROLE_BOARD_FIXTURES_RESTRICTION,
            PAROLE_BOARD_TESTING_RESTRICTION,
          ],
        },
      ],
    },
  },
  // Tests may import the fixtures and test helpers, but not react-magnetic-di. This block
  // replaces the one above for test files, so it lists only the DI restriction.
  {
    files: TEST_FILES,
    ignores: ["**/*.examples.tsx", "**/examples/*.tsx", "**/.examples/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        { paths: [MAGNETIC_DI_RESTRICTION] },
      ],
    },
  },
  {
    files: ["**/*.mjs", "**/*.mts"],
    languageOptions: {
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
  },
);

// Adapted from https://github.com/nrwl/nx/issues/28871
// Remove the jsx-a11y plugin from the react config because we already extend the
// recommended config from eslint-plugin-jsx-a11y in the top-level eslint.config.mjs
// file.
const getWorkingReactConfig = () => {
  const config = nxPlugin.configs["flat/react"];
  for (const singleConfig of config) {
    if (singleConfig?.plugins?.["jsx-a11y"]) {
      delete singleConfig.plugins["jsx-a11y"];
      if (singleConfig.rules) {
        for (const rule of Object.keys(singleConfig.rules)) {
          if (rule.includes("jsx-a11y")) {
            delete singleConfig.rules[rule];
          }
        }
      }
    }
  }
  return config;
};
const workingReactConfig = getWorkingReactConfig();

export const designSystemRestrictedImports = {
  name: "@recidiviz/design-system",
  importNames: [
    "Button",
    "palette",
    "Dropdown",
    "DropdownMenu",
    "DropdownMenuItem",
    "DropdownToggle",
    "Menubar",
    "Icon",
    "IconSVG",
  ],
  message: "Please import from ~design-system instead.",
};

export const reactRestrictedImports = [designSystemRestrictedImports];

export const reactConfig = tseslint.config(
  {
    files: ["**/*.*ts", "**/*.*tsx", "**/*.*js", "**/*.*jsx"],
    extends: [workingReactConfig, eslintPluginMobx.flatConfigs.recommended],
    rules: {
      "no-console": [
        "error",
        {
          allow: ["warn", "error"],
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [...reactRestrictedImports],
        },
      ],
      "getter-return": "off",
      "react/jsx-no-useless-fragment": [
        "error",
        {
          allowExpressions: true,
        },
      ],
      "react/display-name": ["error"],
      "react/react-in-jsx-scope": "off",
      "react/no-unstable-nested-components": ["error"],
      "react/forbid-prop-types": "error",
      "react/no-array-index-key": "error",
      "mobx/missing-observer": "off",
      "mobx/exhaustive-make-observable": "off",
    },
  },
  {
    files: ["**/*.*jsx", "**/*.*tsx"],
    extends: [eslintPluginJsxA11y.flatConfigs.recommended],
  },
  {
    settings: {
      componentWrapperFunctions: ["observer"],
    },
  },
);

export const jiiRestrictedImports = [
  // include these again because eslint will not deep-merge the rule options
  ...reactRestrictedImports,
  {
    name: "react-router-dom",
    importNames: ["useParams"],
    message:
      "Please import useTypedParams from react-router-typesafe-routes/dom instead",
  },
  {
    name: "i18next",
    importNames: ["default"],
    message:
      "Don't use the default i18next instance. Use the observable instance managed by TranslationStore instead.",
  },
];

export const esmRestrictedImports = [
  {
    name: "lodash",
    message: "lodash does not support ESM, please use lodash-es instead",
  },
];

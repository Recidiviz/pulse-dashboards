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

export default tseslint.config(
  {
    ignores: ["**/dist", "vite.config.mts.timestamp-*"],
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
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.test.js", "**/*.test.jsx"],
    extends: [eslintPluginVitest.configs.recommended],
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
          paths: [
            {
              name: "styled-components",
              message: "Please import from styled-components/macro.",
            },
          ],
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

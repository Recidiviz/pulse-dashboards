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

import { FlatCompat } from "@eslint/eslintrc";
import { configs as wdioConfig } from "eslint-plugin-wdio";
import path from "path";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "url";

import baseConfig, { reactConfig } from "../../eslint.config.mjs";

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default tseslint.config(
  {
    ignores: ["public/"],
  },
  {
    ignores: [
      "# comment next line to lint everything",
      "node_modules/",
      "build/",
      "public/",
      "src/auth0/**/*.js",
      "**/*.template",
    ],
  },
  baseConfig,
  reactConfig,
  {
    files: ["**/*.*ts", "**/*.*tsx", "**/*.*js", "**/*.*jsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          message:
            "Do not use Firestore's setDoc directly, use the FirestoreStore.updateDocument method instead.",
          selector: "CallExpression[callee.name='setDoc']",
        },
      ],
    },
  },
  {
    files: ["src/**/*"],
    rules: {
      "no-restricted-globals": ["error", "jest"],
      "no-restricted-properties": [
        "error",
        {
          object: "window",
          property: "analytics",
          message:
            "Do not use Segment analytics directly, use the AnalyticsStore instead.",
        },
      ],
    },
  },
  {
    files: ["**/*.*ts", "**/*.*tsx"],
    rules: {
      // TODO TS re-enable this after repo is ported to TS
      "@typescript-eslint/no-explicit-any": "off",
      // TODO TS re-enable this after repo is ported to TS
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
  {
    extends: [wdioConfig["flat/recommended"]],
    files: ["src/cucumber/**/*", "wdio.conf.js"],
  },
  ...compat
    .config({
      extends: ["plugin:vitest-globals/recommended"],
      env: {
        "vitest-globals/env": true,
      },
      globals: {
        fetchMock: true,
      },
    })
    .map((config) => ({
      ...config,
      files: [
        "**/__tests__/**/*",
        "**/__mocks__/**/*",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.test.js",
        "**/*.test.jsx",
      ],
    })),
  {
    files: ["src/**/AnalyticsStore.*"],
    rules: {
      "no-restricted-properties": [
        "off",
        {
          object: "window",
          property: "analytics",
        },
      ],
    },
  },
);

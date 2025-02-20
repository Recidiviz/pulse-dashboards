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
  baseConfig,
  reactConfig,
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
);

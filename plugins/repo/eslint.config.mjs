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

import jsoncEslintParser from "jsonc-eslint-parser";
import tseslint from "typescript-eslint";

import baseConfig from "../../eslint.config.mjs";

export default tseslint.config(
  {
    ignores: ["src/generators/lib/files", "node_modules/**"],
  },
  baseConfig,
  {
    files: ["**/*.json"],
    rules: {
      "@nx/dependency-checks": "error",
    },
    languageOptions: {
      parser: jsoncEslintParser,
    },
  },
  {
    files: ["./package.json", "./generators.json"],
    rules: {
      "@nx/nx-plugin-checks": "error",
    },
    languageOptions: {
      parser: jsoncEslintParser,
    },
  },
);

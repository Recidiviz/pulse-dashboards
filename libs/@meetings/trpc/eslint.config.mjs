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

import tseslint from "typescript-eslint";

import baseConfig from "../../../eslint.config.mjs";

// Admin-only code is imported only by other admin code (see the README in each admin folder).
const absoluteImportsOnly = {
  group: [".*"],
  message: "Use absolute imports instead of relative ones.",
};

const adminOnly = {
  group: [
    "~@meetings/tasks/admin/**",
    "~@meetings/trpc/routes/admin/**",
    "~@meetings/trpc/services/admin/**",
  ],
  message:
    "Admin code is internal. Only other admin code may import it; see the README in the admin folder.",
};

export default tseslint.config(
  baseConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // This enforces that we use absolute imports for all of the code in this project
      "no-restricted-imports": [
        "error",
        { patterns: [absoluteImportsOnly, adminOnly] },
      ],
    },
  },
  {
    files: [
      "src/routes/admin/**",
      "src/services/admin/**",
      "src/router.ts",
      "__tests__/routes/admin/**",
      "__tests__/services/admin/**",
    ],
    rules: {
      "no-restricted-imports": ["error", { patterns: [absoluteImportsOnly] }],
    },
  },
);

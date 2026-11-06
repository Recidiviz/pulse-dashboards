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

// @ts-check

import tseslint from "typescript-eslint";

import baseConfig, {
  designSystemRestrictedImports,
} from "../../../../eslint.config.mjs";

export default tseslint.config(
  baseConfig,
  {
    files: ["**/*.*js", "**/*.*jsx", "**/*.*ts", "**/*.*tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [designSystemRestrictedImports],
        },
      ],
    },
  },
  {
    // Generic Calendar code never imports a state's code: everything
    // outside a us_co folder must work for any calendar, and only a state's
    // own folders (src/us_co/<calendar> and their tests) import it. This block
    // replaces the one above for those files, so it repeats its paths. It uses
    // the plain rule because the root config's typescript-eslint copy holds
    // the repo-wide restrictions, which a second copy here would replace.
    files: ["**/*.{ts,tsx,mts,cts}"],
    // src/router.ts is the module's router, which serves Colorado's API, so
    // it's the one generic file that imports a us_co folder.
    ignores: ["**/us_co/**", "src/router.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [designSystemRestrictedImports],
          patterns: [
            {
              regex: "(^|/)us_co(/|$)",
              message:
                "Generic Calendar code must not import a state's code from a us_co folder.",
            },
          ],
        },
      ],
    },
  },
  {
    // The database tests assert through these helpers from
    // __tests__/setup/fixtures.ts.
    files: ["**/*.test.ts"],
    rules: {
      "vitest/expect-expect": [
        "error",
        {
          assertFunctionNames: [
            "expect",
            "expectConstraintError",
            "expectUniqueError",
          ],
        },
      ],
    },
  },
);

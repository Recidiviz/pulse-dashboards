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

import baseConfig, { reactConfig } from "../../eslint.config.mjs";

export default tseslint.config(baseConfig, reactConfig, {
  files: ["**/*.*js", "**/*.*jsx", "**/*.*ts", "**/*.*tsx"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          // Need to include these again because eslint doesn't deep merge rules
          {
            name: "styled-components",
            message: "Please import from styled-components/macro.",
          },
          {
            name: "react-router-dom",
            importNames: ["useParams"],
            message:
              "Please import useTypedParams from react-router-typesafe-routes/dom instead",
          },
          {
            name: "@recidiviz/design-system",
            importNames: [
              "Dropdown",
              "DropdownMenu",
              "DropdownMenuLabel",
              "DropdownMenuItem",
              "DropdownToggle",
            ],
            message:
              "Please use components from src/components/Dropdown instead",
          },
        ],
      },
    ],
  },
});

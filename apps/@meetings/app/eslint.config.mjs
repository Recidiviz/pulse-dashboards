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

import nx from "@nx/eslint-plugin";
import tailwind from "eslint-plugin-tailwindcss";
import path from "path";

import baseConfig from "../../../eslint.config.mjs";
import noRnText from "./.eslint-rules/no-rn-text.js";

const ADMIN_MESSAGE =
  "Admin code is internal. Import it only through the entry points described in src/admin/README.md.";

const adminDeepImports = (...exceptions) => ({
  group: ["~@meetings/app/admin/**", ...exceptions.map((e) => `!${e}`)],
  message: ADMIN_MESSAGE,
});

const adminEntryImport = {
  regex: "^~@meetings/app/admin$",
  message: ADMIN_MESSAGE,
};

export default [
  ...baseConfig,
  ...nx.configs["flat/react"],
  ...tailwind.configs["flat/recommended"],
  {
    settings: {
      tailwindcss: {
        config: path.resolve(
          process.cwd(),
          "apps/@meetings/app/tailwind.config.js",
        ),
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    plugins: {
      local: {
        rules: {
          "no-rn-text": noRnText,
        },
      },
    },
    // Override or add rules here
    rules: {
      "tailwindcss/no-custom-classname": "off",
      "tailwindcss/classnames-order": "off", // conflicts with prettier
      "no-restricted-globals": [
        "warn",
        {
          name: "Intl",
          message:
            "Use date-fns utilities instead of Intl.* functions for better React Native compatibility",
        },
      ],
      "local/no-rn-text": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/admin/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [adminDeepImports(), adminEntryImport],
        },
      ],
    },
  },
  {
    files: ["src/app/navigation/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [adminDeepImports()] }],
    },
  },
  {
    files: [
      "src/widgets/header/**/*.{ts,tsx}",
      "src/widgets/navigation-drawer/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            adminDeepImports("~@meetings/app/admin/navigation"),
            adminEntryImport,
          ],
        },
      ],
    },
  },
  {
    ignores: [".expo", "web-build", "cache", "dist", "ios", "android"],
  },
];

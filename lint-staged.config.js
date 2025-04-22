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

const formatCommand = (files) => `nx format:write --files=${files.join(",")}`;

const lintCommand = (files) =>
  // file list will include all projects, so any one project can just ignore what doesn't apply to it
  `nx affected -t lint-files --files=${files.join(",")} --fix --no-error-on-unmatched-pattern ${files
    .map((path) => {
      // assuming a relative path, the first two path segments are [project type]/[project name];
      // these should be removed to make the path relative to the project root
      return path.split("/").slice(2).join("/");
    })
    .join(" ")}`;

module.exports = {
  // for linting and typechecking refer to (or create) per-project config file;
  "**/*.{ts,tsx,mts}": [
    (files) => `nx affected -t typecheck --files=${files.join(",")}`,
    lintCommand,
    formatCommand,
  ],
  "**/*.{js,jsx,mjs}": [lintCommand, formatCommand],
  "**/*.{!ts,tsx,js,jsx,mjs,mts}": [formatCommand],
  "tsconfig.base.json": [() => "nx lint-import-paths"],
  "**/*.{yaml,yml}": [lintCommand],
};

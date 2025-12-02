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

const escapeParens = (s) => s.replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const quote = (s) => `"${s}"`;

const formatCommand = (files) => {
  // lint-staged passes the files as absolute paths, so we need to escape parentheses (reentry NEXT app uses them in paths)
  const escaped = files.map(escapeParens);
  return `nx format:write --files=${quote(escaped.join(","))}`;
};

// recently added feature flag will resolve the closest config for each file, meaning we don't need
// to rely on the Nx project graph (which does not play nicely with lint-staged)
const lintCommand =
  "yarn eslint --flag v10_config_lookup_from_file --max-warnings 0 --no-warn-ignored --fix";

const terraformFormatCommand = (files) => {
  // terraform fmt only works on directories or individual files
  // Get the list of files and format them
  const escaped = files.map(escapeParens).map(quote);
  return `terraform fmt ${escaped.join(" ")}`;
};

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
  "**/project.json": [
    (files) => `nx affected -t projectTags --files=${files.join(",")}`,
  ],
  "libs/atmos/**/*.tf": [terraformFormatCommand],
};

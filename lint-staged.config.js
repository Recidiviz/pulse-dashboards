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
  const escaped = files.map(escapeParens);
  return `nx format:write --files=${quote(escaped.join(","))}`;
};

const lintCommand = (files) => {
  // lint-staged passes the files as absolute paths, so we need to escape parentheses (reentry NEXT app uses them in paths)
  const escapedFiles = files.map(escapeParens);
  const filesArg = quote(escapedFiles.join(","));
  const projectPaths = files
    // assuming a relative path, the first two path segments are [project type]/[project name];
    // these should be removed to make the path relative to the project root
    .map((path) => path.split("/").slice(2).join("/"))
    .map(escapeParens)
    .map(quote)
    .join(" ");
  // file list will include all projects, so any one project can just ignore what doesn't apply to it
  return `nx affected -t lint-files --files=${filesArg} --fix --no-error-on-unmatched-pattern ${projectPaths}`;
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
  "apps/@reentry/backend/**/*.py": [
    () => `cd apps/@reentry/backend && pre-commit run --all-files`,
  ],
};

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

const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const AtmosFilesToClean = [
  /^\.terraform$/,
  /^\.terraform\.lock\.hcl$/,
  /^.+\.tfvars\.json$/,
  /^providers_override\.tf\.json$/,
  /^backend\.tf\.json$/,
];

function clean(file) {
  const target = `${file.path}/${file.name}`;
  console.log(chalk.dim(`rm ${target}`));
  fs.rmSync(target, { recursive: true, force: true });
}

function walkDirectory(dirPath, accumulateMatcher, accumulator) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });

  return files.reduce((targets, file) => {
    const fullPath = path.join(dirPath, file.name);

    if (accumulateMatcher(file)) {
      targets.push(file);
    } else if (file.isDirectory()) {
      walkDirectory(fullPath, accumulateMatcher, accumulator);
    }
    return targets;
  }, accumulator);
}

module.exports = function cleanAtmosFiles() {
  const filesToClean = walkDirectory(
    "./components/terraform",
    (file) =>
      AtmosFilesToClean.reduce((found, pattern) => {
        return found || pattern.test(file.name);
      }, false),
    [],
  );

  if (filesToClean.length) {
    console.log("Cleaning generated atmos files:");
    for (const file of filesToClean) {
      clean(file);
    }
  }
};

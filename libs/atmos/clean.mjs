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

/* eslint-disable no-console -- this is a script that prints its output */

import fs from "fs";
import path from "path";

const AtmosFilesToClean = [
  /^\.terraform$/,
  /^\.terraform\.lock\.hcl$/,
  /^.+\.tfvars\.json$/,
  /^providers_override\.tf\.json$/,
];

function clean(file) {
  const target = `${file.path}/${file.name}`;
  console.log(`Cleaning ${target}`);
  fs.rmSync(target, { recursive: true, force: true });
}

function cleanDirectory(dirPath) {
  fs.readdir(dirPath, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${err}`);
      return;
    }

    files.forEach((file) => {
      const fullPath = path.join(dirPath, file.name);

      const shouldClean = AtmosFilesToClean.reduce((found, pattern) => {
        return found || pattern.test(file.name);
      }, false);

      if (shouldClean) {
        clean(file);
      } else if (file.isDirectory()) {
        cleanDirectory(fullPath);
      }
    });
  });
}

cleanDirectory("./components/terraform");

// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

const fs = require("fs/promises");
const path = require("path");

async function getBuildPath() {
  const outputPath = JSON.parse(
    await fs.readFile(path.join(__dirname, "project.json")),
  ).targets.build.options.outputPath;

  const rootDir = process.env.NX_WORKSPACE_ROOT;
  return path.join(rootDir, outputPath);
}

// this seems like something the NX esbuild plugin's native "assets" feature
// should be able to handle, but it simply does not, for reasons unclear?
const copyConfigsPlugin = {
  name: "Copy Config Files",
  setup(build) {
    build.onEnd(async () => {
      const outputDir = await getBuildPath();

      const configsDir = path.join(__dirname, "deploy-configs");

      const files = await fs.readdir(configsDir);
      await Promise.all(
        files.map(async (fname) => {
          console.log(`Copying config file ${fname} to build directory ...`);
          await fs.cp(
            path.join(configsDir, fname),
            path.join(outputDir, fname),
          );
          if (fname.match("service-account")) {
            await fs.cp(
              path.join(configsDir, fname),
              path.join(outputDir, "configs", fname),
            );
          }
        }),
      );
    });
  },
};

module.exports = {
  plugins: [copyConfigsPlugin],
};

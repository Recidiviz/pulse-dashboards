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

const fs = require("fs");
const path = require("path");
const { sentryEsbuildPlugin } = require("@sentry/esbuild-plugin");
const { execSync } = require("child_process");
const dotenv = require("dotenv");

// we need to translate dotenv files into the build output
const dotenvPlugin = {
  name: "example",
  setup(build) {
    build.onEnd(() => {
      // expect a dotenv corresponding to the active Nx configuration
      const configId = process.env.NX_TASK_TARGET_CONFIGURATION;
      const dotenvSource = path.join(__dirname, `.env.${configId}`);
      if (!fs.existsSync(dotenvSource)) {
        throw new Error(`missing expected file ${dotenvSource}`);
      }

      const outputPath = JSON.parse(
        fs.readFileSync(path.join(__dirname, "project.json")),
      ).targets.build.options.outputPath;

      const rootDir = process.env.NX_WORKSPACE_ROOT;
      const outputDir = path.join(rootDir, outputPath);

      // the functions deployment runtime will be looking for this file by default
      const dotenvDestination = path.join(outputDir, ".env");

      // make sure directory exists; sometimes (e.g. in watch mode) this runs before final output is written
      fs.mkdirSync(outputDir, { recursive: true });
      fs.copyFileSync(dotenvSource, dotenvDestination);
    });
  },
};

const plugins = [dotenvPlugin];

if (process.env.SENTRY_ENV !== "development") {
  const secretVars = dotenv.parse(
    execSync(`sops decrypt ${path.join(__dirname, ".enc.env.build")}`),
  );
  if (secretVars.SENTRY_AUTH_TOKEN) {
    // Sentry sourcemap plugin must be last
    plugins.push(
      sentryEsbuildPlugin({
        org: "recidiviz-inc",
        project: "jii-backend",
        authToken: secretVars.SENTRY_AUTH_TOKEN,
        sourcemaps: {
          assets: ["**/*.cjs", "**/*.cjs.map"],
        },
      }),
    );
  }
}

module.exports = {
  plugins,
};

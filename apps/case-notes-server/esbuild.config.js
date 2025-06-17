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

const { sentryEsbuildPlugin } = require("@sentry/esbuild-plugin");

module.exports = {
  plugins: [
    // This plugin will upload any generated sourcemaps to Sentry and then delete them before they are included in the docker image
    sentryEsbuildPlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      // We disable this sourcemap upload because it is non-deterministic and forces a rebuild on every single deploy
      sourcemaps: {
        disable: true,
        // This still works even though the sourcemaps are disabled **shrug**
        filesToDeleteAfterUpload: ["**/*.js.map"],
      },
      // legacy sourcemaps are deterministic on the build output, so this is preferable
      release: {
        uploadLegacySourcemaps: {
          paths: ["dist/apps/case-notes-server"],
        },
      },
    }),
  ],
};

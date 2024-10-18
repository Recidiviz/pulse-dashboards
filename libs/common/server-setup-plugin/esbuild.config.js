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
    // It automatically tags the release with the commit sha, so it will be easy to cross reference issues with the code that caused them
    sentryEsbuildPlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      debug: true,
      sourcemaps: {
        filesToDeleteAfterUpload: ["**/*.js.map"],
      },
    }),
  ],
};

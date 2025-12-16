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

const plugins = [];

if (process.env.SENTRY_ENV !== "development") {
  // Sentry sourcemap plugin must be last
  plugins.push(
    sentryEsbuildPlugin({
      org: "recidiviz-inc",
      project: "jii-backend",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: ["**/*.js", "**/*.js.map"],
      },
    }),
  );
}

module.exports = {
  plugins,
};

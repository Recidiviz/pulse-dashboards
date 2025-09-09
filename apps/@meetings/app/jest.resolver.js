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

const defaultResolver = require("@nx/jest/plugins/resolver");

module.exports = (request, options) => {
  // Check if we're resolving from the winter directory and request is for runtime
  if (
    options.basedir &&
    options.basedir.includes("expo/src/winter") &&
    request === "./runtime"
  ) {
    // Force resolution to non-native version to avoid runtime.native.ts
    return defaultResolver("./runtime.ts", options);
  }

  return defaultResolver(request, options);
};

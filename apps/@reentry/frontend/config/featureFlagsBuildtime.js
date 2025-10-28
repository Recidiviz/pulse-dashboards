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

/**
 * Build-time feature flag helper for next.config.js
 *
 * This file uses CommonJS to be directly importable by next.config.js
 * during the NX project graph phase (before TypeScript compilation).
 *
 * For runtime feature flag checks, use feature_flags.ts instead.
 */

const { FEATURE_FLAGS_CONFIG } = require("./featureFlagsConfig");

function getCurrentEnvironment() {
  if (process.env["NEXT_PUBLIC_ENVIRONMENT"]) {
    return process.env["NEXT_PUBLIC_ENVIRONMENT"].toLowerCase();
  }

  return "dev";
}

function isFeatureEnabled(featureName, currentEnv = getCurrentEnvironment()) {
  const enabledEnvironments = FEATURE_FLAGS_CONFIG[featureName];

  if (!enabledEnvironments) {
    return false;
  }

  // Split by comma and check if current environment is in the list
  const envList = enabledEnvironments
    .split(",")
    .map((env) => env.trim().toLowerCase());

  return envList.includes(currentEnv.toLowerCase());
}

module.exports = { isFeatureEnabled };

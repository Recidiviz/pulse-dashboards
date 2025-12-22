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
 * Set which features are enabled in which environments.
 * Use a comma separate list of environments with lowercase names.
 *
 * This file uses CommonJS to be directly importable by buildtime helpers
 * and during runtime.
 *
 */
const FEATURE_FLAGS_CONFIG = {
  ENABLE_SOURCE_MAPS: "development,dev,demo,pilot,staging",
  CLIENT_ADDITION: "development,dev,demo,pilot",
  CLIENT_DELETION: "development,dev,demo,pilot",
  INTAKE_RESET: "development,dev,demo,pilot,staging",
  REGENERATE_WITH_PROMPT: "",
  TEST_FEATURE_DEV: "dev",
  TEST_FEATURE_DEV_STAGING: "dev,staging",
};

module.exports = { FEATURE_FLAGS_CONFIG };

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

import { ResidentsConfig, StateCode } from "./types";
import { usAzResidentsConfig } from "./US_AZ/residents/residentsConfig";
import { usIdResidentsConfig } from "./US_ID/residents/config";
import { usMaResidentsConfig } from "./US_MA/residents/config";
import { usNcResidentsConfig } from "./US_NC/residents/residentsConfig";
import { usNeResidentsConfig } from "./US_NE/residents/residentsConfig";
import { usTnResidentsConfig } from "./US_TN/residents/residentsConfig";

/**
 * All configuration objects for the residents application are locally defined.
 */
export const residentsConfigByState: Record<StateCode, ResidentsConfig> = {
  US_AZ: usAzResidentsConfig,
  US_ID: usIdResidentsConfig,
  US_MA: usMaResidentsConfig,
  US_NC: usNcResidentsConfig,
  US_NE: usNeResidentsConfig,
  US_TN: usTnResidentsConfig,
  // This config is just a placeholder for TS typing since Utah will always get redirect to the reentry tool
  US_UT: usIdResidentsConfig,
};

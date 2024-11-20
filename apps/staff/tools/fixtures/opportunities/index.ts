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

import * as US_AR from "./US_AR";
import * as US_AZ from "./US_AZ";
import * as US_CA from "./US_CA";
import * as US_IA from "./US_IA";
import * as US_ID from "./US_ID";
import * as US_ME from "./US_ME";
import * as US_MI from "./US_MI";
import * as US_MO from "./US_MO";
import * as US_ND from "./US_ND";
import * as US_NE from "./US_NE";
import * as US_OR from "./US_OR";
import * as US_PA from "./US_PA";
import * as US_TN from "./US_TN";
const allConfigs = {
  ...US_AZ.mockApiOpportunityConfigurationResponse.enabledConfigs,
  ...US_AR.mockApiOpportunityConfigurationResponse.enabledConfigs,
  ...US_CA.mockApiOpportunityConfigurationResponse.enabledConfigs,
  ...US_ME.mockApiOpportunityConfigurationResponse.enabledConfigs,
  ...US_MI.mockApiOpportunityConfigurationResponse.enabledConfigs,
  ...US_OR.mockApiOpportunityConfigurationResponse.enabledConfigs,
  ...US_PA.mockApiOpportunityConfigurationResponse.enabledConfigs,
  ...US_TN.mockApiOpportunityConfigurationResponse.enabledConfigs,
  ...US_ID.mockApiOpportunityConfigurationResponse.enabledConfigs,
  ...US_MO.mockApiOpportunityConfigurationResponse.enabledConfigs,
  ...US_ND.mockApiOpportunityConfigurationResponse.enabledConfigs,
  ...US_NE.mockApiOpportunityConfigurationResponse.enabledConfigs,
  ...US_IA.mockApiOpportunityConfigurationResponse.enabledConfigs,
} as const;
export default allConfigs;
export type FixtureOpportunityType = keyof typeof allConfigs;

// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { AgencyConfig } from "~@meetings/config/types";
import US_AZ_CONFIG from "~@meetings/config/US_AZ";
import US_CO_CONFIG from "~@meetings/config/US_CO";
import US_ME_CONFIG from "~@meetings/config/US_ME";
import US_ND_CONFIG from "~@meetings/config/US_ND";
import US_NE_CONFIG from "~@meetings/config/US_NE";
import US_TN_CONFIG from "~@meetings/config/US_TN";

export const AGENCY_CONFIGS: Record<string, AgencyConfig> = {
  US_AZ: US_AZ_CONFIG,
  US_CO: US_CO_CONFIG,
  US_ME: US_ME_CONFIG,
  US_ND: US_ND_CONFIG,
  US_NE: US_NE_CONFIG,
  US_TN: US_TN_CONFIG,
};

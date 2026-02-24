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
import US_ME_CONFIG from "~@meetings/config/US_ME";
import US_NE_CONFIG from "~@meetings/config/US_NE";

export const AGENCY_CONFIGS: Record<string, AgencyConfig> = {
  US_ME: US_ME_CONFIG,
  US_NE: US_NE_CONFIG,
};

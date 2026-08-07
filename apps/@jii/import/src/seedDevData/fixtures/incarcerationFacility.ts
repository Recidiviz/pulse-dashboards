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

import { StateCode } from "~@jii/configs";
import { locationRecordFixtures } from "~datatypes";

import { getEnabledStateCodes } from "../../utils/getEnabledStateCodes";
import { buildFixtureMap } from "./buildFixtureMap";

const allFacilityFixtures = locationRecordFixtures
  .filter(
    (r) =>
      getEnabledStateCodes().includes(r.stateCode as StateCode) &&
      r.system === "INCARCERATION" &&
      r.idType === "facilityId",
  )
  .map((r) => ({
    id: r.locationId,
    name: r.name,
    stateCode:
      // we already verified this in the filter step above
      r.stateCode as StateCode,
  }));

export const facilityFixtures = buildFixtureMap(allFacilityFixtures);

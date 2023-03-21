// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { LocationRecord } from "../../src/FirestoreStore/types";
import { FixtureData } from "../workflowsFixtures";

const data: LocationRecord[] = [
  {
    stateCode: "US_MO",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "FACILITY1",
    name: "Facility #1",
  },
  {
    stateCode: "US_MO",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "FACILITY2",
    name: "Facility #2",
  },
];

export const locationsData: FixtureData<LocationRecord> = {
  data,
  idFunc: (r) => r.id,
};

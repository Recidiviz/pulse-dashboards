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

import { LocationRecord } from "../../src/FirestoreStore/types";
import { FirestoreFixture } from "./utils";

const data: LocationRecord[] = [
  //
  // Arkansas
  //
  {
    stateCode: "US_AR",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "FACILITY1",
    name: "Central Prison",
  },
  {
    stateCode: "US_AR",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "FACILITY2",
    name: "Upstate Facility",
  },

  //
  // Idaho
  //
  {
    stateCode: "US_ID",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "FACILITY1",
    name: "Lunar Penal Colony",
  },
  {
    stateCode: "US_ID",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "LRC",
    name: "Lunar Reentry Center",
  },
  {
    stateCode: "US_ID",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "PRC",
    name: "Phobos Reentry Center",
  },

  //
  // Michigan
  //

  {
    stateCode: "US_MI",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "FACILITY1",
    name: "Facility #1",
  },
  {
    stateCode: "US_MI",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "FACILITY2",
    name: "Facility #2",
  },

  //
  // Missouri
  //

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

  //
  // Tennessee
  //

  {
    stateCode: "US_TN",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "BLEDSOE_CC",
    name: "Bledsoe County Correctional Complex",
  },
  {
    stateCode: "US_TN",
    system: "INCARCERATION",
    idType: "facilityUnitId",
    id: "BLEDSOE_CC‡UNIT A",
    name: "Bledsoe County Correctional Complex/UNIT A",
  },
];

export const locationsData: FirestoreFixture<LocationRecord> = {
  data,
  idFunc: (r) => r.id,
};

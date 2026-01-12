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

import { LocationRecord } from "./schema";

export const locationRecordFixtures: Array<LocationRecord> = [
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
  // Arizona
  //
  {
    stateCode: "US_AZ",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "FACILITY1",
    name: "Facility 1",
  },
  {
    stateCode: "US_AZ",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "FACILITY2",
    name: "Facility 2",
  },
  {
    stateCode: "US_AZ",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "FACILITY3",
    name: "Facility 3",
  },

  //
  // Colorado
  //
  {
    stateCode: "US_CO",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "CO_DEMO_FACILITY",
    name: "Colorado Demo Facility",
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
    idType: "crcFacilityId",
    id: "CRC LRC",
    name: "Lunar Reentry Center",
  },
  {
    stateCode: "US_ID",
    system: "INCARCERATION",
    idType: "crcFacilityId",
    id: "CRC PRC",
    name: "Phobos Reentry Center",
  },
  {
    stateCode: "US_ID",
    system: "SUPERVISION",
    idType: "districtId",
    id: "DISTRICT1",
    name: "District 1",
  },

  //
  // Massachusetts
  //
  {
    stateCode: "US_MA",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "DEMO FACILITY",
    name: "Demo Facility",
  },
  {
    stateCode: "US_MA",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "DEMO FACILITY 2",
    name: "Demo Facility 2",
  },

  //
  // Maine
  //
  {
    stateCode: "US_ME",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "FACILITY NAME",
    name: "Demo Facility",
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
  // North Carolina
  //

  {
    stateCode: "US_NC",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "NC_DEMO_FACILITY",
    name: "Facility 1",
  },

  //
  // Nebraska
  //

  {
    stateCode: "US_NE",
    system: "INCARCERATION",
    idType: "facilityId",
    id: "DEMOFACILITY",
    name: "Demo Facility",
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

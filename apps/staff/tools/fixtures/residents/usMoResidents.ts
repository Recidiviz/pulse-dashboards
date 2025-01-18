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

import { ResidentFixture } from "../residents";

export const usMoResidents: ResidentFixture[] = [
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingRelease"],
    stateCode: "US_MO",
    personExternalId: "RES007",
    displayId: "dRES007",
    personName: {
      givenNames: "Eli",
      surname: "Greenberg",
    },
    gender: "MALE",
    pseudonymizedId: "anonres007",
    facilityId: "FACILITY1",
    unitId: "UNIT E",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingRelease"],
    stateCode: "US_MO",
    personExternalId: "RES008",
    displayId: "dRES008",
    personName: {
      givenNames: "Ivan",
      surname: "Dimitriadis",
    },
    gender: "MALE",
    pseudonymizedId: "anonres008",
    facilityId: "FACILITY2",
    unitId: "UNIT F",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingRelease"],
    stateCode: "US_MO",
    personExternalId: "RES009",
    displayId: "dRES009",
    personName: {
      givenNames: "Simon",
      surname: "Kumar",
    },
    gender: "MALE",
    pseudonymizedId: "anonres009",
    facilityId: "FACILITY1",
    unitId: "UNIT G",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingRelease"],
    stateCode: "US_MO",
    personExternalId: "RES010",
    displayId: "dRES010",
    personName: {
      givenNames: "Alexa",
      surname: "Catrel",
    },
    gender: "TRANS_FEMALE",
    pseudonymizedId: "anonres010",
    facilityId: "FACILITY2",
    unitId: "UNIT H",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingInitialHearing"],
    stateCode: "US_MO",
    personExternalId: "RES011",
    displayId: "dRES011",
    personName: {
      givenNames: "Aanya",
      surname: "Sharma",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres011",
    facilityId: "FACILITY1",
    unitId: "UNIT E",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingInitialHearing"],
    stateCode: "US_MO",
    personExternalId: "RES012",
    displayId: "dRES008",
    personName: {
      givenNames: "Nina",
      surname: "Ruelas",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres012",
    facilityId: "FACILITY2",
    unitId: "UNIT F",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingInitialHearing"],
    stateCode: "US_MO",
    personExternalId: "RES013",
    displayId: "dRES013",
    personName: {
      givenNames: "Jason",
      surname: "Holman",
    },
    gender: "MALE",
    pseudonymizedId: "anonres013",
    facilityId: "FACILITY1",
    unitId: "UNIT G",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingInitialHearing"],
    stateCode: "US_MO",
    personExternalId: "RES014",
    displayId: "dRES014",
    personName: {
      givenNames: "Sam",
      surname: "Coolridge",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres014",
    facilityId: "FACILITY2",
    unitId: "UNIT H",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingReviewHearing"],
    stateCode: "US_MO",
    personExternalId: "RES015",
    displayId: "dRES015",
    personName: {
      givenNames: "Harold",
      surname: "Thompson",
    },
    gender: "MALE",
    pseudonymizedId: "anonres015",
    facilityId: "FACILITY1",
    unitId: "UNIT E",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingReviewHearing"],
    stateCode: "US_MO",
    personExternalId: "RES016",
    displayId: "dRES016",
    personName: {
      givenNames: "Harriet",
      surname: "Davis",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres016",
    facilityId: "FACILITY2",
    unitId: "UNIT F",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingReviewHearing"],
    stateCode: "US_MO",
    personExternalId: "RES017",
    displayId: "dRES017",
    personName: {
      givenNames: "Kofi",
      surname: "Anderson",
    },
    gender: "MALE",
    pseudonymizedId: "anonres017",
    facilityId: "FACILITY1",
    unitId: "UNIT G",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingReviewHearing"],
    stateCode: "US_MO",
    personExternalId: "RES018",
    displayId: "dRES018",
    personName: {
      givenNames: "Elise",
      surname: "Baker",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres018",
    facilityId: "FACILITY2",
    unitId: "UNIT H",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {},
  },
];

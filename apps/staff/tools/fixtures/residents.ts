// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { relativeFixtureDate } from "~datatypes";

import { ResidentRecord } from "../../src/FirestoreStore/types";
import { FirestoreFixture } from "./utils";

const data: Omit<ResidentRecord, "personType" | "recordId">[] = [
  {
    allEligibleOpportunities: ["usIdExpandedCRC"],
    officerId: "ID_CASE_MANAGER_1",
    stateCode: "US_ID",
    personExternalId: "ID_RES001",
    displayId: "RES001",
    personName: {
      givenNames: "Bender",
      middleNames: "Bending",
      surname: "Rodriguez",
    },
    pseudonymizedId: "anonres001",
    facilityId: "FACILITY1",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2019-08-12",
    releaseDate: "2025-10-22",
  },
  {
    allEligibleOpportunities: ["usIdCRCWorkRelease"],
    officerId: "ID_CASE_MANAGER_1",
    stateCode: "US_ID",
    personExternalId: "ID_RES002",
    displayId: "RES002",
    personName: {
      givenNames: "Antonio",
      surname: "Calculon",
    },
    pseudonymizedId: "anonres002",
    facilityId: "FACILITY1",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2020-01-12",
    releaseDate: "2026-07-06",
  },
  {
    allEligibleOpportunities: ["usIdCRCWorkRelease", "usIdCRCResidentWorker"],
    officerId: "ID_CASE_MANAGER_1",
    stateCode: "US_ID",
    personExternalId: "ID_RES003",
    displayId: "RES003",
    personName: {
      givenNames: "Hedonism",
      surname: "Bot",
    },
    pseudonymizedId: "anonres003",
    facilityId: "FACILITY1",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2017-07-12",
    releaseDate: "2027-06-06",
  },
  {
    allEligibleOpportunities: ["usIdCRCResidentWorker"],
    officerId: "ID_CASE_MANAGER_1",
    stateCode: "US_ID",
    personExternalId: "ID_RES004",
    displayId: "RES004",
    personName: {
      givenNames: "Execubot",
      surname: "Gamma",
    },
    pseudonymizedId: "anonres004",
    facilityId: "FACILITY1",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2021-07-12",
    releaseDate: "2027-06-06",
  },

  {
    allEligibleOpportunities: [
      "usMeSCCP",
      "usMeWorkRelease",
      "usMeFurloughRelease",
    ],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES001",
    displayId: "dRES001",
    personName: {
      givenNames: "First",
      surname: "Resident",
    },
    pseudonymizedId: "anonres001",
    facilityId: "FACILITY NAME",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -8, months: -1 }),
    releaseDate: relativeFixtureDate({ months: 35 }),
    sccpEligibilityDate: relativeFixtureDate({ months: 5 }),
    portionServedNeeded: "2/3",
  },
  {
    allEligibleOpportunities: [
      "usMeSCCP",
      "usMeWorkRelease",
      "usMeFurloughRelease",
    ],

    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES002",
    displayId: "dRES002",
    personName: {
      givenNames: "Second",
      surname: "Resident",
    },
    pseudonymizedId: "anonres002",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ months: -46, days: 1 }),
    releaseDate: relativeFixtureDate({ months: 26 }),
    sccpEligibilityDate: relativeFixtureDate({ months: 2 }),
    portionServedNeeded: "2/3",
  },
  {
    allEligibleOpportunities: [
      "usMeSCCP",
      "usMeWorkRelease",
      "usMeFurloughRelease",
    ],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES003",
    displayId: "dRES003",
    personName: {
      givenNames: "Third",
      surname: "Resident",
    },
    pseudonymizedId: "anonres003",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -2, months: -6, days: 2 }),
    releaseDate: relativeFixtureDate({ years: 2 }),
    sccpEligibilityDate: relativeFixtureDate({
      months: -3,
    }),
    portionServedNeeded: "1/2",
  },
  {
    allEligibleOpportunities: ["usMeSCCP"],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES004",
    displayId: "dRES004",
    personName: {
      givenNames: "Fourth",
      surname: "Resident",
    },
    pseudonymizedId: "anonres004",
    facilityId: "FACILITY NAME",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ months: -31, days: 2 }),
    releaseDate: relativeFixtureDate({ months: 25 }),
    sccpEligibilityDate: relativeFixtureDate({
      months: -3,
    }),
    portionServedNeeded: "1/2",
  },
  {
    allEligibleOpportunities: ["usMeSCCP"],

    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES005",
    displayId: "dRES005",
    personName: {
      givenNames: "Fifth",
      surname: "Resident",
    },
    pseudonymizedId: "anonres005",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -1, months: -7 }),
    releaseDate: relativeFixtureDate({ years: 2, months: 5 }),
    sccpEligibilityDate: relativeFixtureDate({ months: 5 }),
    portionServedNeeded: "1/2",
  },

  {
    allEligibleOpportunities: ["usMoRestrictiveHousingStatusHearing"],
    officerId: "OFFICER1",
    stateCode: "US_MO",
    personExternalId: "RES004",
    displayId: "dRES004",
    personName: {
      givenNames: "Fourth",
      surname: "Resident",
    },
    pseudonymizedId: "anonres004",
    facilityId: "FACILITY1",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
  },
  {
    allEligibleOpportunities: ["usMoRestrictiveHousingStatusHearing"],
    officerId: "OFFICER1",
    stateCode: "US_MO",
    personExternalId: "RES005",
    displayId: "dRES005",
    personName: {
      givenNames: "Fifth",
      surname: "Resident",
    },
    pseudonymizedId: "anonres005",
    facilityId: "FACILITY2",
    unitId: "UNIT C",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
  },
  {
    allEligibleOpportunities: ["usMoRestrictiveHousingStatusHearing"],
    officerId: "OFFICER1",
    stateCode: "US_MO",
    personExternalId: "RES006",
    displayId: "dRES006",
    personName: {
      givenNames: "Sixth",
      surname: "Resident",
    },
    pseudonymizedId: "anonres006",
    facilityId: "FACILITY2",
    unitId: "UNIT D",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingRelease"],
    officerId: "OFFICER1",
    stateCode: "US_MO",
    personExternalId: "RES007",
    displayId: "dRES007",
    personName: {
      givenNames: "Seventh",
      surname: "Resident",
    },
    pseudonymizedId: "anonres007",
    facilityId: "FACILITY2",
    unitId: "UNIT E",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingRelease"],
    officerId: "OFFICER1",
    stateCode: "US_MO",
    personExternalId: "RES008",
    displayId: "dRES008",
    personName: {
      givenNames: "Eighth",
      surname: "Resident",
    },
    pseudonymizedId: "anonres008",
    facilityId: "FACILITY2",
    unitId: "UNIT F",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingRelease"],
    officerId: "OFFICER1",
    stateCode: "US_MO",
    personExternalId: "RES009",
    displayId: "dRES009",
    personName: {
      givenNames: "Ninth",
      surname: "Resident",
    },
    pseudonymizedId: "anonres009",
    facilityId: "FACILITY2",
    unitId: "UNIT G",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingRelease"],
    officerId: "OFFICER1",
    stateCode: "US_MO",
    personExternalId: "RES010",
    displayId: "dRES010",
    personName: {
      givenNames: "Ninth",
      surname: "Resident",
    },
    pseudonymizedId: "anonres010",
    facilityId: "FACILITY2",
    unitId: "UNIT H",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingInitialHearing"],
    officerId: "OFFICER1",
    stateCode: "US_MO",
    personExternalId: "RES011",
    displayId: "dRES011",
    personName: {
      givenNames: "Eleventh",
      surname: "Resident",
    },
    pseudonymizedId: "anonres011",
    facilityId: "FACILITY2",
    unitId: "UNIT E",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingInitialHearing"],
    officerId: "OFFICER1",
    stateCode: "US_MO",
    personExternalId: "RES012",
    displayId: "dRES008",
    personName: {
      givenNames: "Twelfth",
      surname: "Resident",
    },
    pseudonymizedId: "anonres012",
    facilityId: "FACILITY2",
    unitId: "UNIT F",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingInitialHearing"],
    officerId: "OFFICER1",
    stateCode: "US_MO",
    personExternalId: "RES013",
    displayId: "dRES013",
    personName: {
      givenNames: "Thirteenth",
      surname: "Resident",
    },
    pseudonymizedId: "anonres013",
    facilityId: "FACILITY2",
    unitId: "UNIT G",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingInitialHearing"],
    officerId: "OFFICER1",
    stateCode: "US_MO",
    personExternalId: "RES014",
    displayId: "dRES014",
    personName: {
      givenNames: "Fourteenth",
      surname: "Resident",
    },
    pseudonymizedId: "anonres014",
    facilityId: "FACILITY2",
    unitId: "UNIT H",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingReviewHearing"],
    officerId: "OFFICER1",
    stateCode: "US_MO",
    personExternalId: "RES015",
    displayId: "dRES015",
    personName: {
      givenNames: "Fifteenth",
      surname: "Resident",
    },
    pseudonymizedId: "anonres015",
    facilityId: "FACILITY2",
    unitId: "UNIT E",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingReviewHearing"],
    officerId: "OFFICER1",
    stateCode: "US_MO",
    personExternalId: "RES016",
    displayId: "dRES016",
    personName: {
      givenNames: "Sixteenth",
      surname: "Resident",
    },
    pseudonymizedId: "anonres016",
    facilityId: "FACILITY2",
    unitId: "UNIT F",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingReviewHearing"],
    officerId: "OFFICER1",
    stateCode: "US_MO",
    personExternalId: "RES017",
    displayId: "dRES017",
    personName: {
      givenNames: "Seventeenth",
      surname: "Resident",
    },
    pseudonymizedId: "anonres017",
    facilityId: "FACILITY2",
    unitId: "UNIT G",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingReviewHearing"],
    officerId: "OFFICER1",
    stateCode: "US_MO",
    personExternalId: "RES018",
    displayId: "dRES018",
    personName: {
      givenNames: "Eighteenth",
      surname: "Resident",
    },
    pseudonymizedId: "anonres018",
    facilityId: "FACILITY2",
    unitId: "UNIT H",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
  },
  {
    allEligibleOpportunities: ["usTnCustodyLevelDowngrade"],
    officerId: "OFFICER5",
    stateCode: "US_TN",
    personExternalId: "RES001",
    displayId: "dRES001",
    personName: {
      givenNames: "First",
      surname: "Resident",
    },
    pseudonymizedId: "anonres001",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT A",
    facilityUnitId: "BLEDSOE_CC‡UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2019-08-12",
    releaseDate: "2025-10-22",
  },
  {
    allEligibleOpportunities: ["usTnCustodyLevelDowngrade"],
    officerId: "OFFICER5",
    stateCode: "US_TN",
    personExternalId: "RES002",
    displayId: "dRES002",
    personName: {
      givenNames: "Second",
      surname: "Resident",
    },
    pseudonymizedId: "anonres002",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT B",
    facilityUnitId: "BLEDSOE_CC‡UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: "2020-08-12",
    releaseDate: "2024-11-27",
  },
  {
    allEligibleOpportunities: ["usTnAnnualReclassification"],
    officerId: "OFFICER5",
    stateCode: "US_TN",
    personExternalId: "RES003",
    displayId: "dRES003",
    personName: {
      givenNames: "Nanny",
      surname: "Bot",
    },
    pseudonymizedId: "anonres003",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT C",
    facilityUnitId: "BLEDSOE_CC‡UNIT C",
    custodyLevel: "MINIMUM",
    admissionDate: "2020-08-12",
    releaseDate: "2025-01-01",
  },
  {
    allEligibleOpportunities: ["usTnAnnualReclassification"],
    officerId: "OFFICER5",
    stateCode: "US_TN",
    personExternalId: "RES004",
    displayId: "dRES004",
    personName: {
      givenNames: "Bending",
      surname: "Bot",
    },
    pseudonymizedId: "anonres004",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT D",
    facilityUnitId: "BLEDSOE_CC‡UNIT D",
    custodyLevel: "MINIMUM",
    admissionDate: "2021-08-12",
    releaseDate: "2025-12-01",
  },
];

export const residentsData: FirestoreFixture<
  Omit<ResidentRecord, "personType" | "recordId">
> = {
  data,
  idFunc: (r) => r.personExternalId,
};

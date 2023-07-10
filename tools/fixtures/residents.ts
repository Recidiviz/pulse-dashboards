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

import { ResidentRecord } from "../../src/FirestoreStore/types";
import { FixtureData } from "../workflowsFixtures";

const data: Omit<ResidentRecord, "personType" | "recordId">[] = [
  {
    allEligibleOpportunities: ["usMeSCCP"],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES001",
    personName: {
      givenNames: "First",
      surname: "Resident",
    },
    pseudonymizedId: "anonres001",
    facilityId: "FACILITY NAME",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2019-08-12",
    releaseDate: "2025-10-22",
    portionServedNeeded: "2/3",
  },
  {
    allEligibleOpportunities: ["usMeSCCP"],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES002",
    personName: {
      givenNames: "Second",
      surname: "Resident",
    },
    pseudonymizedId: "anonres002",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: "2020-08-12",
    releaseDate: "2024-11-27",
    portionServedNeeded: "1/2",
  },
  {
    allEligibleOpportunities: ["usMeSCCP"],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES003",
    personName: {
      givenNames: "Third",
      surname: "Resident",
    },
    pseudonymizedId: "anonres003",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: "2020-09-12",
    releaseDate: "2024-10-27",
    portionServedNeeded: "2/3",
  },

  {
    allEligibleOpportunities: ["usMoRestrictiveHousingStatusHearing"],
    officerId: "OFFICER1",
    stateCode: "US_MO",
    personExternalId: "RES004",
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
    allEligibleOpportunities: ["usTnCustodyLevelDowngrade"],
    officerId: "OFFICER5",
    stateCode: "US_TN",
    personExternalId: "RES001",
    personName: {
      givenNames: "First",
      surname: "Resident",
    },
    pseudonymizedId: "anonres001",
    facilityId: "FACILITY NAME",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2019-08-12",
    releaseDate: "2025-10-22",
  },
  {
    allEligibleOpportunities: ["usTnCustodyLevelDowngrade"],
    officerId: "OFFICER5",
    stateCode: "US_TN",
    personExternalId: "RES002",
    personName: {
      givenNames: "Second",
      surname: "Resident",
    },
    pseudonymizedId: "anonres002",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: "2020-08-12",
    releaseDate: "2024-11-27",
  },
];

export const residentsData: FixtureData<
  Omit<ResidentRecord, "personType" | "recordId">
> = {
  data,
  idFunc: (r) => r.personExternalId,
};

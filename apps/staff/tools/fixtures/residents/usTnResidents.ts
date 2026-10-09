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

import { rawUsTnResidentMetadata, relativeFixtureDate } from "~datatypes";

import { ResidentFixture } from "../residents";

// Staff-only TN residents. The shared TN residents live in ~datatypes; these
// stay here because they exist for the staff e2e specs.
export const usTnResidents: ResidentFixture[] = [
  // Also a TN client under the same id (fixtures/clients/usTnClients.ts), with
  // a different officer and a facility instead of a district.
  {
    allEligibleOpportunities: [],
    stateCode: "US_TN",
    personExternalId: "E2E_TN_BOTH",
    displayId: "dE2E_TN_BOTH",
    personName: {
      givenNames: "Delphine",
      surname: "Okonkwo-Hale",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonE2E_TN_BOTH",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT A",
    officerId: "E2E_TN_FACILITY_OFFICER",
    custodyLevel: "MEDIUM",
    admissionDate: relativeFixtureDate({ years: -1, days: -30 }),
    releaseDate: relativeFixtureDate({ years: 1, days: 90 }),
    metadata: rawUsTnResidentMetadata,
  },
];

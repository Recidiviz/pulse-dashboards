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

import { OpportunityInfo } from "../OpportunityInfo";
import { SupervisionOfficerWithOpportunityDetails } from "../SupervisionOfficerWithOpportunityDetails";
import { rawExcludedSupervisionOfficerFixture } from "./ExcludedSupervisionOfficerFixture";
import { supervisionOfficerFixture } from "./SupervisionOfficerFixture";
import { supervisionOfficerSupervisorsFixture } from "./SupervisionOfficerSupervisor";

// TODO: (#6043) Use fixtures in `SupervisionSupervisorOpportunityDetailPresenter.test.ts` to determine code.
export const opportunityInfoFixture: Record<string, OpportunityInfo[]> = {
  [supervisionOfficerSupervisorsFixture[0].externalId]: [
    {
      label: "UsXxMockOppOne",
      priority: "HIGH",
      officersWithEligibleClients: [
        { ...rawExcludedSupervisionOfficerFixture[0], clientsEligibleCount: 3 },
        { ...supervisionOfficerFixture[0], clientsEligibleCount: 4 },
      ] as SupervisionOfficerWithOpportunityDetails[],
      clientsEligibleCount: 7,
    },
    {
      label: "UsXxMockOppTwo",
      priority: "HIGH",
      officersWithEligibleClients: [
        { ...rawExcludedSupervisionOfficerFixture[0], clientsEligibleCount: 1 },
        { ...rawExcludedSupervisionOfficerFixture[1], clientsEligibleCount: 2 },
      ] as SupervisionOfficerWithOpportunityDetails[],
      clientsEligibleCount: 3,
    },
  ],
  [supervisionOfficerSupervisorsFixture[1].externalId]: [
    {
      label: "UsXxMockOppTwo",
      priority: "NORMAL",
      officersWithEligibleClients: [
        { ...supervisionOfficerFixture[3], clientsEligibleCount: 4 },
      ] as SupervisionOfficerWithOpportunityDetails[],
      clientsEligibleCount: 5,
    },
  ],
};

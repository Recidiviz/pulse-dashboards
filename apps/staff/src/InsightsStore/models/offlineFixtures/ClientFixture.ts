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

import { size } from "lodash";

import {
  clientInfoFixture,
  excludedSupervisionOfficerFixture,
  supervisionOfficerFixture,
} from "~datatypes";

import { clientsData } from "../../../../../staff/tools/fixtures/clients";
import { ClientRecord } from "../../../FirestoreStore";
import { SupervisionOpportunityType } from "../../../WorkflowsStore";
import {
  mockUsXxOpp,
  mockUsXxTwoOpp,
} from "../../../WorkflowsStore/Opportunity/__fixtures__";

const { data: rawWorkflowsClientsData } = clientsData;

export const CLIENTS_OFFICERS = [
  supervisionOfficerFixture[0],
  supervisionOfficerFixture[1],
  supervisionOfficerFixture[2],
  excludedSupervisionOfficerFixture[0],
];

const ELIGIBLE_OPPORTUNITY_CASES = [
  [mockUsXxOpp],
  [mockUsXxOpp, mockUsXxTwoOpp],
  [mockUsXxTwoOpp],
];

/**
 * Converts {@link clientInfoFixture} to {@link rawWorkflowsClientsData} by filling in
 * workflows fields NOT on the clientInfoFixture with workflows data from the rawWorkflowsClient.
 * The stateCode is US_XX to generalize the `Client` and the `officerId` is one of the four in
 * {@link CLIENTS_OFFICERS}. The `allEligibleOpportunities` is one of the three in {@link ELIGIBLE_OPPORTUNITY_CASES}.
 */
export const clientFixture: Record<string, ClientRecord> = Object.entries(
  clientInfoFixture,
).reduce(
  /**
   * Converts {@link clientInfoFixture} to {@link rawWorkflowsClientsData}
   * @param acc mapping of pid to client
   * @param param1 @type [string, ClientInfoFixture]
   * @param idx index of the fixture in {@link clientsData}
   * @returns
   */
  (acc, [pId, insightsClientInfo], idx) => {
    acc[pId] = {
      // Workflows fields filled by Workflows fixture.
      ...rawWorkflowsClientsData[idx],
      personType: "CLIENT",
      stateCode: "US_XX",
      // Workflows fields filled by Insights data
      personExternalId: insightsClientInfo.clientId,
      pseudonymizedId: pId,
      personName: insightsClientInfo.fullName,
      recordId: `us_xx_${insightsClientInfo.clientId}`,
      officerId: CLIENTS_OFFICERS[idx % CLIENTS_OFFICERS.length].externalId,
      // One of the three opportunity cases, except for the last two,
      // where the client has no eligible opportunities.
      allEligibleOpportunities:
        size(clientInfoFixture) - idx <= 2
          ? []
          : (ELIGIBLE_OPPORTUNITY_CASES[
              idx % ELIGIBLE_OPPORTUNITY_CASES.length
            ] as SupervisionOpportunityType[]),
    };

    return acc;
  },
  {} as Record<string, ClientRecord>,
);

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

import { UsMiMinimumTelephoneReportingReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsMi";
import { fixtureWithIdKey } from "./utils";

export const usMiMinimumTelephoneReportingReferralsFixture =
  fixtureWithIdKey<UsMiMinimumTelephoneReportingReferralRecordRaw>(
    "externalId",
    [
      {
        stateCode: "US_MI",
        externalId: "010",
        eligibleCriteria: {
          onMinimumSupervisionAtLeastSixMonths: null,
          usMiSupervisionAndAssessmentLevelEligibleForTelephoneReporting: {
            initialAssessmentLevel: "MEDIUM",
            supervisionLevelRawText: "MEDIUM",
          },
          usMiNotServingIneligibleOffensesForTelephoneReporting: null,
          usMiNotRequiredToRegisterUnderSora: null,
          supervisionNotPastFullTermCompletionDateOrUpcoming90Days: null,
          usMiIfServingAnOuilOrOwiHasCompleted12MonthsOnSupervision: null,
        },
        ineligibleCriteria: {},
        metadata: {
          eligibleDate: "2024-02-03",
        },
      },
    ],
  );
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
import { parseISO } from "date-fns";

import { ClientRecord } from "../../../../FirestoreStore";
import { dateToTimestamp } from "../../../utils";
import { SupervisionOpportunityType } from "../../OpportunityConfigs";
import {
  UsMiMinimumTelephoneReportingReferralRecord,
  UsMiPastFTRDReferralRecord,
} from "..";

export const ineligibleClientRecord: ClientRecord = {
  recordId: "us_mi_001",
  personName: {
    givenNames: "BETTY",
    surname: "RUBBLE",
  },
  personExternalId: "001",
  displayId: "d001",
  pseudonymizedId: "p001",
  stateCode: "US_MI",
  officerId: "OFFICER3",
  supervisionType: "PROBATION",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  address: "123 Bedrock Lane",
  phoneNumber: "5555555678",
  expirationDate: dateToTimestamp("2024-12-31"),
  allEligibleOpportunities: [],
  personType: "CLIENT",
};

export const usMiClassificationReviewIneligibleClientRecord: ClientRecord = {
  recordId: "us_mi_001",
  personName: {
    givenNames: "PATRICK",
    surname: "KING",
  },
  personExternalId: "001",
  displayId: "d001",
  pseudonymizedId: "p001",
  stateCode: "US_MI",
  officerId: "OFFICER3",
  supervisionType: "PROBATION",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  address: "123 Bedrock Lane",
  phoneNumber: "5555555678",
  expirationDate: dateToTimestamp("2024-12-31"),
  allEligibleOpportunities: [],
  personType: "CLIENT",
};

export const usMiClassificationReviewEligibleClientRecord: ClientRecord = {
  recordId: "us_xx_cr-eligible-1",
  personName: { givenNames: "Eugene", surname: "Krabs" },
  personExternalId: "cr-eligible-1",
  displayId: "dcr-eligible-1",
  pseudonymizedId: "pseudo-cr-eligible-1",
  stateCode: "US_XX",
  officerId: "OFFICER1",
  supervisionType: "PROBATIONER",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  currentBalance: 221.88,
  specialConditions: [],
  allEligibleOpportunities: [
    "usMiClassificationReview",
  ] as SupervisionOpportunityType[],
  personType: "CLIENT",
};

export const usMiMinimumTelephoneReportingEligibleClientRecord: ClientRecord = {
  recordId: "us_mi_010",
  personName: {
    givenNames: "GORAN",
    surname: "IVANISEVIC",
  },
  personExternalId: "010",
  displayId: "d010",
  pseudonymizedId: "p010",
  stateCode: "US_MI",
  officerId: "OFFICER8",
  supervisionType: "PROBATION",
  supervisionLevel: "HIGH",
  supervisionLevelStart: "2019-12-20",
  currentBalance: 221.88,
  specialConditions: [],
  allEligibleOpportunities: ["usMiMinimumTelephoneReporting"],
  personType: "CLIENT",
};

export const usMiMinimumTelephoneReportingReferralRecord: UsMiMinimumTelephoneReportingReferralRecord =
  {
    stateCode: "US_MI",
    externalId: "010",
    eligibleCriteria: {
      onMinimumSupervisionAtLeastSixMonths: null,
      usMiSupervisionAndAssessmentLevelEligibleForTelephoneReporting: {
        initialAssessmentLevel: "MEDIUM/MEDIUM",
        supervisionLevelRawText: "MEDIUM",
      },
      usMiNotRequiredToRegisterUnderSora: null,
      usMiNotServingIneligibleOffensesForTelephoneReporting: null,
      supervisionNotPastFullTermCompletionDateOrUpcoming90Days: null,
      usMiIfServingAnOuilOrOwiHasCompleted12MonthsOnSupervision: null,
    },
    ineligibleCriteria: {},
    caseNotes: {
      foo: [
        {
          noteTitle: "A title",
          noteBody: "A body",
          eventDate: parseISO("2022-06-28"),
        },
      ],
    },
    metadata: {
      eligibleDate: parseISO("2022-07-02"),
    },
  };

export const usMiPastFTRDRecordFixture: UsMiPastFTRDReferralRecord = {
  stateCode: "US_MI",
  externalId: "001",
  eligibleCriteria: {
    supervisionPastFullTermCompletionDate: {
      eligibleDate: parseISO("2022-01-03"),
    },
  },
  ineligibleCriteria: {},
};

export const usMiPastFTRDEligibleClientRecord: ClientRecord = {
  ...ineligibleClientRecord,
  allEligibleOpportunities: ["usMiPastFTRD"],
};

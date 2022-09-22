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
import { Required as RequireKeys } from "utility-types";

import { ClientRecord } from "../../../firestore";
import { dateToTimestamp } from "../../utils";
import { CompliantReportingReferralRecord } from "../CompliantReportingReferralRecord";
import { EarlyTerminationReferralRecord } from "../EarlyTerminationReferralRecord";
import { LSUReferralRecord } from "../LSUReferralRecord";
import { PastFTRDReferralRecord } from "../PastFTRDReferralRecord";

export const compliantReportingEligibleClientRecord = {
  recordId: "us_xx_cr-eligible-1",
  personName: { givenNames: "Test", surname: "Name" },
  personExternalId: "cr-eligible-1",
  pseudonymizedId: "pseudo-cr-eligible-1",
  stateCode: "US_XX",
  officerId: "OFFICER1",
  supervisionType: "TN PROBATIONER",
  supervisionLevel: "STANDARD: MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  currentBalance: 221.88,
  specialConditions: [],
  compliantReportingEligible: true,
};

export const compliantReportingReferralRecord: Partial<CompliantReportingReferralRecord> = {
  stateCode: "US_XX",
  tdocId: "cr-eligible-1",
  eligibilityCategory: "c1",
  remainingCriteriaNeeded: 0,
  mostRecentArrestCheck: dateToTimestamp("2022-05-28"),
  eligibleLevelStart: dateToTimestamp("2019-12-20"),
  judicialDistrict: "A",
  finesFeesEligible: "regular_payments",
  drugScreensPastYear: [
    { result: "DRUN", date: dateToTimestamp("2022-01-04") },
  ],
  sanctionsPastYear: [],
  currentOffenses: ["EXAMPLE CURRENT"],
  pastOffenses: [],
  lifetimeOffensesExpired: ["EXAMPLE EXPIRED"],
  specialConditionsFlag: "current",
  lastSpecialConditionsNote: "2022-03-15",
};

export const compliantReportingAlmostEligibleCriteria: Required<
  NonNullable<CompliantReportingReferralRecord["almostEligibleCriteria"]>
> = {
  passedDrugScreenNeeded: true,
  paymentNeeded: true,
  currentLevelEligibilityDate: "2022-08-15",
  seriousSanctionsEligibilityDate: "2022-08-15",
  recentRejectionCodes: ["TEST1"],
};

export const compliantReportingAlmostEligibleReferralRecord: Partial<CompliantReportingReferralRecord> = {
  stateCode: "US_XX",
  tdocId: "cr-almost-eligible-1",
  almostEligibleCriteria: compliantReportingAlmostEligibleCriteria,
  eligibilityCategory: "c1",
  remainingCriteriaNeeded: 1,
  mostRecentArrestCheck: dateToTimestamp("2022-05-28"),
  eligibleLevelStart: dateToTimestamp("2019-12-20"),
  judicialDistrict: "A",
  finesFeesEligible: "regular_payments",
  drugScreensPastYear: [],
  sanctionsPastYear: [],
  currentOffenses: ["EXAMPLE CURRENT"],
  pastOffenses: [],
  lifetimeOffensesExpired: ["EXAMPLE EXPIRED"],
  specialConditionsFlag: "current",
  lastSpecialConditionsNote: "2022-03-15",
};

export const compliantReportingAlmostEligibleClientRecord = {
  recordId: "us_xx_cr-almost-eligible-1",
  compliantReportingEligible: true,
  personName: { givenNames: "Test", surname: "Name" },
  personExternalId: "cr-almost-eligible-1",
  pseudonymizedId: "pseudo-cr-almost-eligible-1",
  stateCode: "US_XX",
  officerId: "OFFICER1",
  supervisionType: "TN PROBATIONER",
  supervisionLevel: "STANDARD: MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  currentBalance: 221.88,
  specialConditions: [],
};

export const earlyTerminationEligibleClientRecord: RequireKeys<
  ClientRecord,
  "earlyTerminationEligible"
> = {
  recordId: "us_nd_110",
  personName: {
    givenNames: "JAMIE",
    surname: "JONES",
  },
  personExternalId: "110",
  pseudonymizedId: "p110",
  stateCode: "US_ND",
  officerId: "OFFICER3",
  supervisionType: "PROBATION",
  supervisionLevel: "STANDARD: MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  address: "123 Bedrock Lane",
  phoneNumber: "5555555678",
  expirationDate: dateToTimestamp("2024-12-31"),
  earlyTerminationEligible: true,
};

export const earlyTerminationReferralRecord: EarlyTerminationReferralRecord = {
  stateCode: "US_ND",
  externalId: "110",
  formInformation: {
    clientName: "Jamie Jones",
    convictionCounty: "NORTH_CENTRAL",
    judgeName: "JUDGE 1",
    priorCourtDate: "2020-01-03",
    sentenceLengthYears: "3",
    crimeNames: ["CHARGE 1", "CHARGE 2"],
    probationExpirationDate: "2022-12-02",
    probationOfficerFullName: "Karl Fog",
    criminalNumber: "12345",
    judicialDistrictCode: "BISMARCK",
  },
  reasons: [
    {
      criteriaName: "SUPERVISION_EARLY_DISCHARGE_DATE_WITHIN_30_DAYS",
      reason: {
        eligibleDate: "2022-01-03",
      },
    },
    {
      criteriaName: "US_ND_NOT_IN_ACTIVE_REVOCATION_STATUS",
      reason: {
        revocationDate: undefined,
      },
    },
    {
      criteriaName: "US_ND_IMPLIED_VALID_EARLY_TERMINATION_SUPERVISION_LEVEL",
      reason: {
        supervisionLevel: "MEDIUM",
      },
    },
    {
      criteriaName: "US_ND_IMPLIED_VALID_EARLY_TERMINATION_SENTENCE_TYPE",
      reason: {
        supervisionType: "PROBATION",
      },
    },
  ],
  metadata: {
    multipleSentences: true,
    outOfState: false,
    ICOut: false,
  },
};

export const LSUReferralRecordFixture: LSUReferralRecord = {
  stateCode: "US_ID",
  externalId: "001",
  formInformation: {
    clientName: "Betty Rubble",
  },
  reasons: [
    {
      criteriaName: "RISK_LEVEL",
      reason: {
        eligibleRiskLevel: {
          riskLevel: "MEDIUM",
          lastIncrease: "2022-01-03",
        },
      },
    },
    {
      criteriaName: "NEGATIVE_UA_WITHIN_90_DAYS",
      reason: {
        lastNegativeUA: "2022-01-03",
      },
    },
    {
      criteriaName: "NO_FELONY_CONVICTIONS",
      reason: {
        lastFelonyConviction: undefined,
      },
    },
    {
      criteriaName: "NO_VIOLENT_OR_DUI_CONVICTIONS",
      reason: {
        lastViolentOrDUIConviction: undefined,
      },
    },
    {
      criteriaName: "VERIFIED_EMPLOYMENT",
      reason: {
        employmentVerifiedDate: "2022-06-03",
      },
    },
  ],
};

export const ineligibleClientRecord: ClientRecord = {
  recordId: "us_id_001",
  personName: {
    givenNames: "BETTY",
    surname: "RUBBLE",
  },
  personExternalId: "001",
  pseudonymizedId: "p001",
  stateCode: "US_ID",
  officerId: "OFFICER3",
  supervisionType: "PROBATION",
  supervisionLevel: "STANDARD: MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  address: "123 Bedrock Lane",
  phoneNumber: "5555555678",
  expirationDate: dateToTimestamp("2024-12-31"),
};

export const LSUEligibleClientRecord: RequireKeys<
  ClientRecord,
  "LSUEligible"
> = {
  ...ineligibleClientRecord,
  LSUEligible: true,
};

export const pastFTRDRecordFixture: PastFTRDReferralRecord = {
  stateCode: "US_ID",
  externalId: "001",
  formInformation: {
    clientName: "Betty Rubble",
  },
  reasons: [
    {
      criteriaName: "SUPERVISION_PAST_FULL_TERM_COMPLETION_DATE",
      reason: {
        eligibleDate: "2022-01-03",
      },
    },
  ],
};

export const pastFTRDEligibleClientRecord: RequireKeys<
  ClientRecord,
  "pastFTRDEligible"
> = {
  ...ineligibleClientRecord,
  pastFTRDEligible: true,
};

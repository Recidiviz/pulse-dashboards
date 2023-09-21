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

import {
  ClientRecord,
  CombinedUserRecord,
  ResidentRecord,
} from "../../../../FirestoreStore";
import { dateToTimestamp } from "../../../utils";
import {
  SupervisionOpportunityType,
  UsTnCustodyLevelDowngradeReferralRecord,
} from "../..";
import {
  CompliantReportingReferralRecord,
  CompliantReportingReferralRecordFull,
} from "../CompliantReportingOpportunity";
import { UsTnExpirationReferralRecord } from "../UsTnExpirationOpportunity";

export const usTnVerifiedOpportunities = {
  usTnExpirationOpportunity: {
    type: "usTnExpiration",
    isLoading: false,
    isHydrated: true,
  },
};

export const ineligibleClientRecord: ClientRecord = {
  recordId: "us_xx_001",
  personName: {
    givenNames: "BETTY",
    surname: "RUBBLE",
  },
  personExternalId: "001",
  displayId: "d001",
  pseudonymizedId: "p001",
  stateCode: "US_XX",
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

export const compliantReportingEligibleClientRecord: ClientRecord = {
  recordId: "us_xx_cr-eligible-1",
  personName: { givenNames: "Test", surname: "Name" },
  personExternalId: "cr-eligible-1",
  displayId: "dcr-eligible-1",
  pseudonymizedId: "pseudo-cr-eligible-1",
  stateCode: "US_XX",
  officerId: "OFFICER1",
  supervisionType: "TN PROBATIONER",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  currentBalance: 221.88,
  specialConditions: [],
  allEligibleOpportunities: [
    "compliantReporting",
  ] as SupervisionOpportunityType[],
  personType: "CLIENT",
};

export const residentRecordBase: ResidentRecord = {
  recordId: "us_tn_002",
  personName: {
    givenNames: "BARNEY",
    surname: "RUBBLE",
  },
  personExternalId: "002",
  displayId: "d002",
  pseudonymizedId: "p002",
  stateCode: "US_TN",
  officerId: "CASEMANAGER1",
  custodyLevel: "MEDIUM",
  releaseDate: dateToTimestamp("2024-12-31"),
  allEligibleOpportunities: [],
  personType: "RESIDENT",
};

export const usTnUserRecord: CombinedUserRecord = {
  info: {
    email: "test-officer@example.com",
    district: "DISTRICT 50",
    id: "OFFICER1",
    stateCode: "US_TN",
    hasCaseload: true,
    hasFacilityCaseload: false,
    givenNames: "Test",
    surname: "Officer1",
    role: "supervision_staff",
  },
};

export const compliantReportingReferralRecord: Partial<CompliantReportingReferralRecordFull> =
  {
    eligibilityCategory: "c1",
    remainingCriteriaNeeded: 0,
    eligibleLevelStart: parseISO("2019-12-20"),
    judicialDistrict: "A",
    drugScreensPastYear: [{ result: "DRUN", date: parseISO("2022-01-04") }],
    currentOffenses: ["EXAMPLE CURRENT"],
    pastOffenses: [],
    lifetimeOffensesExpired: ["EXAMPLE EXPIRED"],
    specialConditionsFlag: "current",
    lastSpecialConditionsNote: parseISO("2022-03-15"),
    eligibleCriteria: {
      usTnFinesFeesEligible: {
        hasFinesFeesBalanceBelow500: {
          amountOwed: 750,
        },
        hasPayments3ConsecutiveMonths: {
          amountOwed: 750,
          consecutiveMonthlyPayments: 3,
        },
      },
      usTnNoArrestsInPastYear: {},
      usTnNoHighSanctionsInPastYear: {},
    },
    ineligibleCriteria: {},
    formInformation: {
      sentenceStartDate: parseISO("2019-12-20"),
    },
    metadata: {
      mostRecentArrestCheck: {
        contactDate: parseISO("2022-05-28"),
        contactType: "ARRN",
      },
    },
  };

export const compliantReportingEligibleWithDiscretionReferralRecord: Partial<CompliantReportingReferralRecordFull> =
  {
    // Required fields
    eligibleLevelStart: parseISO("2019-12-20"),
    drugScreensPastYear: [{ result: "DRUN", date: parseISO("2022-01-04") }],
    lifetimeOffensesExpired: [],

    // Eligible with discretion: Prior offenses and lifetime offenses expired less than 10 years ago
    pastOffenses: ["EXAMPLE PAST"],
    offenseTypeEligibility: "2",

    // Eligible with discretion: Previous zero-tolerance codes
    eligibilityCategory: "c3",
    zeroToleranceCodes: [
      { contactNoteDate: parseISO("2022-06-01"), contactNoteType: "ZTVR" },
    ],

    // Eligible with discretion: Missing sentence information
    currentOffenses: [],

    // TODO(#3587): Make this actually be eligible with discretion
    eligibleCriteria: {
      usTnFinesFeesEligible: {
        hasFinesFeesBalanceBelow500: {
          amountOwed: 600,
        },
        hasPayments3ConsecutiveMonths: {
          amountOwed: 600,
          consecutiveMonthlyPayments: 3,
        },
      },
      usTnNoArrestsInPastYear: {},
      usTnNoHighSanctionsInPastYear: {},
    },
    ineligibleCriteria: {},
    formInformation: {
      sentenceStartDate: parseISO("2019-12-20"),
    },
    metadata: {
      mostRecentArrestCheck: {
        contactDate: parseISO("2022-05-28"),
        contactType: "ARRN",
      },
    },
  };

export const compliantReportingAlmostEligibleCriteria: Required<
  NonNullable<CompliantReportingReferralRecord["almostEligibleCriteria"]>
> = {
  passedDrugScreenNeeded: true,
  currentLevelEligibilityDate: parseISO("2022-08-15"),
  recentRejectionCodes: ["TEST1"],
};

export const compliantReportingIneligibleCriteria: Required<
  NonNullable<CompliantReportingReferralRecordFull["ineligibleCriteria"]>
> = {
  usTnFinesFeesEligible: {
    hasFinesFeesBalanceBelow500: {
      amountOwed: 600,
    },
    hasPayments3ConsecutiveMonths: {
      amountOwed: 600,
      consecutiveMonthlyPayments: 0,
    },
  },
  usTnNoHighSanctionsInPastYear: {
    latestHighSanctionDate: parseISO("2021-08-15"),
  },
};

export const compliantReportingAlmostEligibleReferralRecord: Partial<CompliantReportingReferralRecordFull> =
  {
    eligibilityCategory: "c1",
    remainingCriteriaNeeded: 1,
    eligibleLevelStart: parseISO("2019-12-20"),
    judicialDistrict: "A",
    drugScreensPastYear: [],
    currentOffenses: ["EXAMPLE CURRENT"],
    pastOffenses: [],
    lifetimeOffensesExpired: ["EXAMPLE EXPIRED"],
    specialConditionsFlag: "current",
    lastSpecialConditionsNote: parseISO("2022-03-15"),

    eligibleCriteria: {
      usTnNoArrestsInPastYear: {},
    },
    ineligibleCriteria: {},
    formInformation: {
      sentenceStartDate: parseISO("2019-12-20"),
    },
    metadata: {
      mostRecentArrestCheck: {
        contactDate: parseISO("2022-05-28"),
        contactType: "ARRN",
      },
    },
  };

export const compliantReportingAlmostEligibleClientRecord: ClientRecord = {
  recordId: "us_xx_cr-almost-eligible-1",
  personName: { givenNames: "Test", surname: "Name" },
  personExternalId: "cr-almost-eligible-1",
  displayId: "dcr-almost-eligible-1",
  pseudonymizedId: "pseudo-cr-almost-eligible-1",
  stateCode: "US_XX",
  officerId: "OFFICER1",
  supervisionType: "TN PROBATIONER",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  currentBalance: 221.88,
  specialConditions: [],
  allEligibleOpportunities: [
    "compliantReporting",
  ] as SupervisionOpportunityType[],
  personType: "CLIENT",
};

export const UsTnExpirationEligibleClientRecord: ClientRecord = {
  ...ineligibleClientRecord,
  allEligibleOpportunities: ["usTnExpiration"],
};

export const UsTnExpirationReferralRecordFixture: UsTnExpirationReferralRecord =
  {
    stateCode: "US_TN",
    externalId: "101",
    formInformation: {
      offenses: ["Charge A", "Charge B"],
      docketNumbers: ["12345"],
      convictionCounties: ["123", "456"],
      sexOffenses: [],
      latestEmp: {
        contactDate: parseISO("2022-01-01"),
        contactType: "EMPV",
        contactComment: "EMPLOYMENT VERIFIED",
      },
      latestVrr: {
        contactDate: parseISO("2022-02-02"),
        contactType: "VRRE",
      },
      newOffenses: [
        {
          contactDate: parseISO("2022-02-09"),
          contactType: "NCAF",
          contactComment: "ARRESTED",
        },
        {
          contactDate: parseISO("2022-02-17"),
          contactType: "NCAC",
          contactComment: "INTERROGATED",
        },
      ],
      alcoholHistory: [
        {
          contactDate: parseISO("2022-02-12"),
          contactType: "FSWR",
          contactComment: "HAD APPOINTMENT",
        },
        {
          contactDate: parseISO("2022-02-07"),
          contactType: "FSWR",
          contactComment: "HAD ANOTHER APPOINTMENT",
        },
      ],
    },
    eligibleCriteria: {
      supervisionPastFullTermCompletionDateOrUpcoming1Day: {
        eligibleDate: parseISO("2022-02-02"),
      },
      usTnNoZeroToleranceCodesSpans: {},
      usTnNotOnLifeSentenceOrLifetimeSupervision: {
        lifetimeFlag: false,
      },
    },
    caseNotes: {
      "Special Conditions": [
        {
          noteTitle: "MUST JOURNAL",
          noteBody: "Client must journal at least once a week",
          eventDate: parseISO("2022-08-22"),
        },
      ],
    },
  };

export const UsTnCustodyLevelDowngradeEligibleResidentRecord: ResidentRecord = {
  ...residentRecordBase,
  allEligibleOpportunities: ["usTnCustodyLevelDowngrade"],
};

export const UsTnCustodyLevelDowngradeReferralRecordFixture: UsTnCustodyLevelDowngradeReferralRecord =
  {
    stateCode: "US_TN",
    externalId: UsTnCustodyLevelDowngradeEligibleResidentRecord.recordId,
    eligibleCriteria: {
      custodyLevelIsNotMax: null,
      custodyLevelHigherThanRecommended: {
        custodyLevel: "MEDIUM",
        recommendedCustodyLevel: "LOW",
      },
      usTnIneligibleForAnnualReclassification: {
        ineligibleCriteria: ["Some reason"],
      },
      usTnLatestCafAssessmentNotOverride: {
        overrideReason: "Some reason",
      },
    },
    ineligibleCriteria: {},
    formInformation: {
      q1Score: -3,
      q2Score: -2,
      q3Score: -1,
      q4Score: 0,
      q5Score: 1,
      q6Score: 2,
      q7Score: 3,
      q8Score: 4,
      q9Score: 5,
    },
    caseNotes: {},
  };

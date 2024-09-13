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

import { parseISO } from "date-fns";

import {
  ClientRecord,
  CombinedUserRecord,
  WorkflowsResidentRecord,
} from "../../../../FirestoreStore";
import { dateToTimestamp } from "../../../utils";
import {
  OpportunityType,
  UsTnCustodyLevelDowngradeReferralRecord,
} from "../..";
import { CompliantReportingReferralRecord } from "../CompliantReportingOpportunity";
import { UsTnAnnualReclassificationReviewReferralRecord } from "../UsTnAnnualReclassificationReviewOpportunity";
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
  allEligibleOpportunities: ["compliantReporting"] as OpportunityType[],
  personType: "CLIENT",
};

export const residentRecordBase: WorkflowsResidentRecord = {
  recordId: "us_tn_002",
  personName: {
    givenNames: "BARNEY",
    surname: "RUBBLE",
  },
  gender: "MALE",
  personExternalId: "002",
  displayId: "d002",
  pseudonymizedId: "p002",
  stateCode: "US_TN",
  officerId: "CASEMANAGER1",
  custodyLevel: "MEDIUM",
  releaseDate: "2024-12-31",
  allEligibleOpportunities: [],
  personType: "RESIDENT",

  metadata: {},
};

export const usTnUserRecord: CombinedUserRecord = {
  info: {
    email: "test-officer@example.com",
    district: "DISTRICT 50",
    id: "OFFICER1",
    stateCode: "US_TN",
    givenNames: "Test",
    surname: "Officer1",
    recordType: "supervisionStaff",
  },
};

export const compliantReportingReferralRecord: Partial<CompliantReportingReferralRecord> =
  {
    eligibleCriteria: {
      usTnOnEligibleLevelForSufficientTime: {
        eligibleDate: parseISO("2021-12-20"),
        eligibleLevel: "MEDIUM",
        startDateOnEligibleLevel: parseISO("2019-12-20"),
      },
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
      usTnNoRecentCompliantReportingRejections: {},
      usTnSpecialConditionsAreCurrent: {
        speNoteDue: null,
      },
      usTnNotServingIneligibleCrOffense: {},
      usTnPassedDrugScreenCheck: {
        hasAtLeast1NegativeDrugTestPastYear: [
          {
            negativeScreenDate: parseISO("2022-01-04"),
            negativeScreenResult: "DRUN",
          },
        ],
        latestDrugTestIsNegative: {
          latestDrugScreenDate: parseISO("2022-01-04"),
          latestDrugScreenResult: "DRUN",
        },
      },
      usTnNoZeroToleranceCodesSpans: null,
      usTnIneligibleOffensesExpired: null,
      usTnNoPriorRecordWithIneligibleCrOffense: null,
      usTnNotServingUnknownCrOffense: null,
      hasActiveSentence: {
        hasActiveSentence: true,
      },
    },
    ineligibleCriteria: {},
    formInformation: {
      sentenceStartDate: parseISO("2019-12-20"),
      currentOffenses: ["EXAMPLE CURRENT"],
      judicialDistrict: ["A"],
    },
    metadata: {
      mostRecentArrestCheck: {
        contactDate: parseISO("2022-05-28"),
        contactType: "ARRN",
      },
      mostRecentSpeNote: {
        contactDate: parseISO("2022-03-15"),
        contactType: "SPEC",
      },
      convictionCounties: [],
      ineligibleOffensesExpired: ["EXAMPLE EXPIRED"],
    },
  };

export const compliantReportingEligibleWithDiscretionReferralRecord: Partial<CompliantReportingReferralRecord> =
  {
    eligibleCriteria: {
      usTnOnEligibleLevelForSufficientTime: {
        eligibleDate: parseISO("2021-12-20"),
        eligibleLevel: "MEDIUM",
        startDateOnEligibleLevel: parseISO("2019-12-20"),
      },
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
      usTnNoRecentCompliantReportingRejections: {},
      usTnSpecialConditionsAreCurrent: {
        speNoteDue: null,
      },
      usTnNotServingIneligibleCrOffense: {},
      usTnPassedDrugScreenCheck: {
        hasAtLeast1NegativeDrugTestPastYear: [
          {
            negativeScreenDate: parseISO("2022-01-04"),
            negativeScreenResult: "DRUN",
          },
        ],
        latestDrugTestIsNegative: {
          latestDrugScreenDate: parseISO("2022-01-04"),
          latestDrugScreenResult: "DRUN",
        },
      },
      // Eligible with discretion: Previous zero-tolerance codes
      usTnNoZeroToleranceCodesSpans: {
        zeroToleranceCodeDates: [parseISO("2022-06-01")],
      },
      // Eligible with discretion: Prior offenses and lifetime offenses expired less than 10 years ago
      usTnIneligibleOffensesExpired: [
        {
          ineligibleOffense: "EXAMPLE PAST",
          relevantDate: parseISO("2023-02-02"),
        },
      ],
      usTnNoPriorRecordWithIneligibleCrOffense: [
        {
          ineligibleOffense: "EXAMPLE PAST INELIGIBLE",
          relevantDate: parseISO("2020-03-03"),
        },
      ],
      usTnNotServingUnknownCrOffense: [
        {
          ineligibleOffense: "EXAMPLE UNKNOWN",
          relevantDate: parseISO("2025-05-05"),
        },
      ],
      hasActiveSentence: {
        // Eligible with discretion: Missing sentence information
        hasActiveSentence: false,
      },
    },
    ineligibleCriteria: {},
    formInformation: {
      sentenceStartDate: parseISO("2019-12-20"),
      currentOffenses: [],
    },
    metadata: {
      mostRecentArrestCheck: {
        contactDate: parseISO("2022-05-28"),
        contactType: "ARRN",
      },
      mostRecentSpeNote: {
        contactDate: parseISO("2022-05-28"),
        contactType: "SPET",
      },
      convictionCounties: [],
      ineligibleOffensesExpired: [],
    },
  };

export const compliantReportingIneligibleCriteria: Required<
  NonNullable<CompliantReportingReferralRecord["ineligibleCriteria"]>
> = {
  usTnOnEligibleLevelForSufficientTime: {
    eligibleDate: parseISO("2022-08-15"),
    eligibleLevel: "MEDIUM",
    startDateOnEligibleLevel: parseISO("2019-12-20"),
  },
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
  usTnNoRecentCompliantReportingRejections: {
    contactCode: ["TEST1"],
  },
};

export const compliantReportingAlmostEligibleReferralRecord: Partial<CompliantReportingReferralRecord> =
  {
    eligibleCriteria: {
      usTnNoArrestsInPastYear: {},
      usTnSpecialConditionsAreCurrent: {
        speNoteDue: null,
      },
      usTnNotServingIneligibleCrOffense: {},
      usTnPassedDrugScreenCheck: {
        hasAtLeast1NegativeDrugTestPastYear: [
          {
            negativeScreenDate: parseISO("2022-01-04"),
            negativeScreenResult: "DRUN",
          },
        ],
        latestDrugTestIsNegative: {
          latestDrugScreenDate: parseISO("2022-01-04"),
          latestDrugScreenResult: "DRUN",
        },
      },
      usTnNoZeroToleranceCodesSpans: null,
      usTnIneligibleOffensesExpired: null,
      usTnNoPriorRecordWithIneligibleCrOffense: null,
      usTnNotServingUnknownCrOffense: null,
      hasActiveSentence: {
        hasActiveSentence: true,
      },
    },
    ineligibleCriteria: {},
    formInformation: {
      sentenceStartDate: parseISO("2019-12-20"),
      currentOffenses: ["EXAMPLE OFFENSE"],
      judicialDistrict: ["A"],
    },
    metadata: {
      mostRecentArrestCheck: {
        contactDate: parseISO("2022-05-28"),
        contactType: "ARRN",
      },
      mostRecentSpeNote: {
        contactDate: parseISO("2022-03-15"),
        contactType: "SPEC",
      },
      convictionCounties: [],
      ineligibleOffensesExpired: ["EXAMPLE EXPIRED"],
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
  allEligibleOpportunities: ["compliantReporting"] as OpportunityType[],
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
    ineligibleCriteria: {},
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

export const UsTnCustodyLevelDowngradeEligibleResidentRecord: WorkflowsResidentRecord =
  {
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
      activeRecommendations: [],
      classificationType: "SPECIAL",
      hasIncompatibles: false,
      incompatibleArray: [],
      statusAtHearingSeg: "GEN",
      currentOffenses: ["ROBBERY-ARMED WITH DEADLY WEAPON"],
      lastCafDate: new Date("2022-08-22"),
      latestPreaScreeningResults: {
        latestPreaScreeningDate: new Date("2022-02-23"),
        aggressorFindingLevelChanged: true,
        victimFindingLevelChanged: false,
      },
      lastCafTotal: "8",
      q1Score: -3,
      q2Score: -2,
      q3Score: -1,
      q4Score: 0,
      q5Score: 1,
      q6Score: 2,
      q7Score: 3,
      q8Score: 4,
      q9Score: 5,
      q6Notes: [{ eventDate: new Date("2022-08-22"), noteBody: "Some note" }],
      q7Notes: [{ eventDate: new Date("2022-08-22"), noteBody: "Some note" }],
      q8Notes: [
        {
          detainerReceivedDate: new Date("2022-08-22"),
          detainerFelonyFlag: true,
          detainerMisdemeanorFlag: false,
        },
      ],
    },
    caseNotes: {},
  };

export const UsTnAnnualReclassificationEligibleResidentRecord: WorkflowsResidentRecord =
  {
    ...residentRecordBase,
    allEligibleOpportunities: ["usTnAnnualReclassification"],
  };

export const UsTnAnnualReclassificationReferralRecordFixture01: UsTnAnnualReclassificationReviewReferralRecord =
  {
    stateCode: "US_TN",
    formReclassificationDueDate: parseISO("2024-01-01"),
    externalId:
      UsTnAnnualReclassificationEligibleResidentRecord.personExternalId,
    eligibleCriteria: {
      usTnAtLeast12MonthsSinceLatestAssessment: null,
      custodyLevelIsNotMax: null,
      custodyLevelComparedToRecommended: {
        custodyLevel: "MINIMUM",
        recommendedCustodyLevel: "MINIMUM",
      },
    },
    ineligibleCriteria: {},
    caseNotes: {
      foo: [
        {
          eventDate: parseISO("2022-04-06"),
          noteBody: "Body1",
          noteTitle: "Title1",
        },
        {
          eventDate: parseISO("2022-06-06"),
          noteBody: "Body2",
          noteTitle: "Title2",
        },
      ],
      "ba bar": [
        {
          eventDate: parseISO("2022-09-06"),
          noteBody: "Body3",
          noteTitle: "Title3",
        },
      ],
    },
    formInformation: {
      currentOffenses: ["ROBBERY-ARMED WITH DEADLY WEAPON"],
      lastCafDate: new Date("2022-08-22"),
      latestPreaScreeningResults: {
        latestPreaScreeningDate: new Date("2022-02-23"),
        aggressorFindingLevelChanged: false,
        victimFindingLevelChanged: true,
      },
      lastCafTotal: "8",
      q1Score: -3,
      q2Score: -2,
      q3Score: -1,
      q4Score: 0,
      q5Score: 1,
      q6Score: 2,
      q7Score: 3,
      q8Score: 4,
      q9Score: 5,
      q6Notes: [{ eventDate: new Date("2022-08-22"), noteBody: "Some note" }],
      q7Notes: [{ eventDate: new Date("2022-08-22"), noteBody: "Some note" }],
      q8Notes: [
        {
          detainerReceivedDate: new Date("2022-08-22"),
          detainerFelonyFlag: true,
          detainerMisdemeanorFlag: false,
        },
      ],
    },
  };

export const UsTnAnnualReclassificationReferralRecordFixture02: UsTnAnnualReclassificationReviewReferralRecord =
  {
    stateCode: "US_TN",
    formReclassificationDueDate: parseISO("2024-02-01"),
    externalId:
      UsTnAnnualReclassificationEligibleResidentRecord.personExternalId,
    eligibleCriteria: {
      usTnAtLeast12MonthsSinceLatestAssessment: null,
      custodyLevelIsNotMax: null,
      custodyLevelComparedToRecommended: {
        custodyLevel: "MEDIUM",
        recommendedCustodyLevel: "MINIMUM",
      },
    },
    ineligibleCriteria: {},
    caseNotes: {
      foo: [
        {
          eventDate: parseISO("2022-04-06"),
          noteBody: "Body1",
          noteTitle: "Title1",
        },
        {
          eventDate: parseISO("2022-06-06"),
          noteBody: "Body2",
          noteTitle: "Title2",
        },
      ],
      "ba bar": [
        {
          eventDate: parseISO("2022-09-06"),
          noteBody: "Body3",
          noteTitle: "Title3",
        },
      ],
    },
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
  };

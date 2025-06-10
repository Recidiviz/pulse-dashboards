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

import { ClientRecord, OpportunityType, ResidentRecord } from "~datatypes";

import { CombinedUserRecord } from "../../../../FirestoreStore";
import { UsTnCustodyLevelDowngradeReferralRecordRaw } from "../..";
import { CompliantReportingReferralRecordRaw } from "../CompliantReportingOpportunity";
import { UsTnAnnualReclassificationReviewReferralRecordRaw } from "../UsTnAnnualReclassificationReviewOpportunity";
import { UsTnExpirationReferralRecordRaw } from "../UsTnExpirationOpportunity";

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
    givenNames: "Betty",
    surname: "Rubble",
  },
  personExternalId: "001",
  displayId: "d001",
  pseudonymizedId: "p001",
  stateCode: "US_XX",
  officerId: "OFFICER3",
  supervisionType: "PROBATION",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: new Date("2019-12-20"),
  address: "123 Bedrock Lane",
  phoneNumber: "5555555678",
  expirationDate: new Date("2022-02-02"),
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
  supervisionLevelStart: new Date("2019-12-20"),
  currentBalance: 221.88,
  specialConditions: [],
  allEligibleOpportunities: ["compliantReporting"] as OpportunityType[],
  personType: "CLIENT",
};

export const residentRecordBase: ResidentRecord = {
  recordId: "us_tn_002",
  personName: {
    givenNames: "Barney",
    surname: "Rubble",
  },
  gender: "MALE",
  personExternalId: "002",
  displayId: "d002",
  pseudonymizedId: "p002",
  stateCode: "US_TN",
  officerId: "CASEMANAGER1",
  custodyLevel: "MEDIUM",
  releaseDate: new Date("2024-12-31"),
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
    pseudonymizedId: "p001",
  },
};

export const compliantReportingReferralRecord: Partial<CompliantReportingReferralRecordRaw> =
  {
    stateCode: "US_TN",
    externalId: "110",
    eligibleCriteria: {
      usTnOnEligibleLevelForSufficientTime: {
        eligibleDate: "2021-12-20",
        eligibleLevel: "MEDIUM",
        startDateOnEligibleLevel: "2019-12-20",
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
      usTnNoArrestsInPastYear: null,
      usTnNoHighSanctionsInPastYear: null,
      usTnNoRecentCompliantReportingRejections: null,
      usTnSpecialConditionsAreCurrent: {
        speNoteDue: null,
      },
      usTnNotServingIneligibleCrOffense: null,
      usTnPassedDrugScreenCheck: {
        hasAtLeast1NegativeDrugTestPastYear: [
          {
            negativeScreenDate: "2022-01-04",
            negativeScreenResult: "DRUN",
          },
        ],
        latestDrugTestIsNegative: {
          latestDrugScreenDate: "2022-01-04",
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
      sentenceStartDate: "2019-12-20",
      currentOffenses: ["EXAMPLE CURRENT"],
      judicialDistrict: ["A"],
    },
    metadata: {
      latestNegativeArrestCheck: {
        contactDate: "2022-05-28",
        contactType: "ARRN",
      },
      mostRecentSpeNote: {
        contactDate: "2022-03-15",
        contactType: "SPEC",
      },
      convictionCounties: [],
      ineligibleOffensesExpired: ["EXAMPLE EXPIRED"],
    },
    isEligible: true,
    isAlmostEligible: false,
  };

export const compliantReportingEligibleWithDiscretionReferralRecord: Partial<CompliantReportingReferralRecordRaw> =
  {
    stateCode: "US_TN",
    externalId: "110",
    eligibleCriteria: {
      usTnOnEligibleLevelForSufficientTime: {
        eligibleDate: "2021-12-20",
        eligibleLevel: "MEDIUM",
        startDateOnEligibleLevel: "2019-12-20",
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
      usTnNoArrestsInPastYear: null,
      usTnNoHighSanctionsInPastYear: null,
      usTnNoRecentCompliantReportingRejections: null,
      usTnSpecialConditionsAreCurrent: {
        speNoteDue: null,
      },
      usTnNotServingIneligibleCrOffense: null,
      usTnPassedDrugScreenCheck: {
        hasAtLeast1NegativeDrugTestPastYear: [
          {
            negativeScreenDate: "2022-01-04",
            negativeScreenResult: "DRUN",
          },
        ],
        latestDrugTestIsNegative: {
          latestDrugScreenDate: "2022-01-04",
          latestDrugScreenResult: "DRUN",
        },
      },
      // Eligible with discretion: Previous zero-tolerance codes
      usTnNoZeroToleranceCodesSpans: {
        zeroToleranceCodeDates: ["2022-06-01"],
      },
      // Eligible with discretion: Prior offenses and lifetime offenses expired less than 10 years ago
      usTnIneligibleOffensesExpired: {
        ineligibleOffenses: ["EXAMPLE PAST"],
        ineligibleSentencesExpirationDates: ["2023-02-02"],
      },
      usTnNoPriorRecordWithIneligibleCrOffense: {
        ineligibleOffenses: ["EXAMPLE PAST INELIGIBLE"],
        ineligibleOffenseDates: ["2020-03-03"],
      },
      usTnNotServingUnknownCrOffense: {
        ineligibleOffenses: ["EXAMPLE UNKNOWN"],
        ineligibleSentencesExpirationDate: ["2025-05-05"],
      },
      hasActiveSentence: {
        // Eligible with discretion: Missing sentence information
        hasActiveSentence: false,
      },
    },
    ineligibleCriteria: {},
    formInformation: {
      sentenceStartDate: "2019-12-20",
      currentOffenses: [],
    },
    metadata: {
      latestNegativeArrestCheck: {
        contactDate: "2022-05-28",
        contactType: "ARRN",
      },
      mostRecentSpeNote: {
        contactDate: "2022-05-28",
        contactType: "SPET",
      },
      convictionCounties: [],
      ineligibleOffensesExpired: [],
    },
    isEligible: true,
    isAlmostEligible: false,
  };

export const compliantReportingIneligibleCriteria: Required<
  NonNullable<CompliantReportingReferralRecordRaw["ineligibleCriteria"]>
> = {
  usTnOnEligibleLevelForSufficientTime: {
    eligibleDate: "2022-08-15",
    eligibleLevel: "MEDIUM",
    startDateOnEligibleLevel: "2019-12-20",
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
    latestHighSanctionDate: "2021-08-15",
  },
  usTnNoRecentCompliantReportingRejections: {
    contactCode: ["TEST1"],
  },
};

export const compliantReportingAlmostEligibleReferralRecord: Partial<CompliantReportingReferralRecordRaw> =
  {
    stateCode: "US_TN",
    externalId: "110",
    eligibleCriteria: {
      usTnNoArrestsInPastYear: null,
      usTnSpecialConditionsAreCurrent: {
        speNoteDue: null,
      },
      usTnNotServingIneligibleCrOffense: null,
      usTnPassedDrugScreenCheck: {
        hasAtLeast1NegativeDrugTestPastYear: [
          {
            negativeScreenDate: "2022-01-04",
            negativeScreenResult: "DRUN",
          },
        ],
        latestDrugTestIsNegative: {
          latestDrugScreenDate: "2022-01-04",
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
      sentenceStartDate: "2019-12-20",
      currentOffenses: ["EXAMPLE OFFENSE"],
      judicialDistrict: ["A"],
    },
    metadata: {
      latestNegativeArrestCheck: {
        contactDate: "2022-05-28",
        contactType: "ARRN",
      },
      mostRecentSpeNote: {
        contactDate: "2022-03-15",
        contactType: "SPEC",
      },
      convictionCounties: [],
      ineligibleOffensesExpired: ["EXAMPLE EXPIRED"],
    },
    isEligible: false,
    isAlmostEligible: true,
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
  supervisionLevelStart: new Date("2019-12-20"),
  currentBalance: 221.88,
  specialConditions: [],
  allEligibleOpportunities: ["compliantReporting"] as OpportunityType[],
  personType: "CLIENT",
};

export const UsTnExpirationEligibleClientRecord: ClientRecord = {
  ...ineligibleClientRecord,
  allEligibleOpportunities: ["usTnExpiration"],
  supervisionLevelStart: new Date("2022-02-02"),
};

export const UsTnExpirationReferralRecordFixture: UsTnExpirationReferralRecordRaw =
  {
    stateCode: "US_TN",
    externalId: "101",
    formInformation: {
      offenses: ["Charge A", "Charge B"],
      docketNumbers: ["12345"],
      convictionCounties: ["123", "456"],
      sexOffenses: [],
      latestEmp: {
        contactDate: "2022-01-01",
        contactType: "EMPV",
        contactComment: "EMPLOYMENT VERIFIED",
      },
      latestVrr: {
        contactDate: "2022-02-02",
        contactType: "VRRE",
      },
      newOffenses: [
        {
          contactDate: "2022-02-09",
          contactType: "NCAF",
          contactComment: "ARRESTED",
        },
        {
          contactDate: "2022-02-17",
          contactType: "NCAC",
          contactComment: "INTERROGATED",
        },
      ],
      alcoholHistory: [
        {
          contactDate: "2022-02-12",
          contactType: "FSWR",
          contactComment: "HAD APPOINTMENT",
        },
        {
          contactDate: "2022-02-07",
          contactType: "FSWR",
          contactComment: "HAD ANOTHER APPOINTMENT",
        },
      ],
    },
    eligibleCriteria: {
      supervisionPastFullTermCompletionDate: {
        eligibleDate: "2022-02-02",
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
          eventDate: "2022-08-22",
        },
      ],
    },
    isEligible: true,
    isAlmostEligible: false,
  };

export const UsTnCustodyLevelDowngradeEligibleResidentRecord: ResidentRecord = {
  ...residentRecordBase,
  allEligibleOpportunities: ["usTnCustodyLevelDowngrade"],
};

export const UsTnCustodyLevelDowngradeReferralRecordFixture: UsTnCustodyLevelDowngradeReferralRecordRaw =
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
      lastCafDate: "2022-08-22",
      latestPreaScreeningResults: {
        latestPreaScreeningDate: "2022-02-23",
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
      q6Notes: [{ eventDate: "2022-08-22", noteBody: "Some note" }],
      q7Notes: [{ eventDate: "2022-08-22", noteBody: "Some note" }],
      q8Notes: [
        {
          detainerReceivedDate: "2022-08-22",
          detainerFelonyFlag: "X",
          detainerMisdemeanorFlag: null,
        },
      ],
    },
    caseNotes: {},
    isEligible: true,
    isAlmostEligible: false,
  };

export const UsTnAnnualReclassificationEligibleResidentRecord: ResidentRecord =
  {
    ...residentRecordBase,
    allEligibleOpportunities: ["usTnAnnualReclassification"],
  };

export const UsTnAnnualReclassificationReferralRecordFixture01: UsTnAnnualReclassificationReviewReferralRecordRaw =
  {
    stateCode: "US_TN",
    formReclassificationDueDate: "2024-01-01",
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
      "PRIOR RECORD OFFENSES": [
        {
          eventDate: "2022-04-06",
          noteTitle: "AGGRAVATED ASSAULT",
        },
        {
          eventDate: "2022-06-06",
          noteTitle: "CRIMINAL IMPERSONATION",
        },
      ],
      "TN, ISC, DIVERSION SENTENCES": [
        {
          eventDate: "2022-09-06",
          noteBody: "Expires: 2028-02-02",
          noteTitle: "POSS FIREARM W/PRIOR VIOL/DEAD WPN CONV",
        },
      ],
    },
    formInformation: {
      currentOffenses: ["ROBBERY-ARMED WITH DEADLY WEAPON"],
      lastCafDate: "2022-08-22",
      latestPreaScreeningResults: {
        latestPreaScreeningDate: "2022-02-23",
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
      q6Notes: [{ eventDate: "2022-08-22", noteBody: "Some note" }],
      q7Notes: [{ eventDate: "2022-08-22", noteBody: "Some note" }],
      q8Notes: [
        {
          detainerReceivedDate: "2022-08-22",
          detainerFelonyFlag: "X",
          detainerMisdemeanorFlag: null,
        },
      ],
    },
    isEligible: true,
    isAlmostEligible: false,
  };

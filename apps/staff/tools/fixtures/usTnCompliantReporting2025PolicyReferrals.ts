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

import { relativeFixtureDate } from "~datatypes";

import { UsTnCompliantReporting2025PolicyReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsTn/UsTnCompliantReporting2025PolicyOpportunity";
import { fixtureWithIdKey } from "./utils";

export const usTnCompliantReporting2025PolicyReferrals =
  fixtureWithIdKey<UsTnCompliantReporting2025PolicyReferralRecordRaw>(
    "externalId",
    [
      {
        stateCode: "US_TN",
        externalId: "100",
        eligibleCriteria: {
          usTnNoArrestsInPast6Months: null,
          usTnNoSupervisionSanctionWithin3Months: null,
          noSupervisionViolationReportWithin6Months: null,
          usTnNoSupervisionViolationsReportWithin6Months: null,
          usTnNotInDayReportingCenterLocation: null,
          usTnNotOnCommunitySupervisionForLife: null,
          usTnNotServingIneligibleCrOffensePolicyB: null,
          latestDrugTestIsNegativeOrMissing: {
            latestDrugScreenDate: relativeFixtureDate({ days: -200 }),
            latestDrugScreenResult: "DRUN",
          },
          onMinimumOrLowMediumSupervisionAtLeastSixMonths: {
            eligibleDate: relativeFixtureDate({ months: -1, days: -5 }),
          },
          usTnAssessedNotHighOnStrongRDomains: {
            assessmentDate: relativeFixtureDate({ days: -121 }),
            assessmentMetadata: {
              AGGRESSION_NEED_LEVEL: "LOW",
              ALCOHOL_DRUG_NEED_LEVEL: "MOD",
            },
          },
          usTnFeeScheduleOrPermanentExemption: {
            contactType: null,
            currentExemptions: "SSDB",
            latestFeeContactDate: null,
          },
        },
        ineligibleCriteria: {},
        metadata: {
          convictionCounties: ["123 - ABC", "456 - DEF"],
          ineligibleOffensesExpired: ["HABITUAL TRAFFIC OFFENDER"],
          mostRecentArrestCheck: {
            contactDate: relativeFixtureDate({ years: -1, days: -33 }),
            contactType: "ARRN",
          },
          mostRecentSpeNote: {
            contactDate: relativeFixtureDate({ days: -222 }),
            contactType: "SPET",
          },
        },
        isEligible: true,
        isAlmostEligible: false,
      },
      {
        stateCode: "US_TN",
        externalId: "101",
        eligibleCriteria: {
          usTnNoArrestsInPast6Months: null,
          usTnNoSupervisionSanctionWithin3Months: null,
          noSupervisionViolationReportWithin6Months: null,
          usTnNoSupervisionViolationsReportWithin6Months: null,
          usTnNotInDayReportingCenterLocation: null,
          usTnNotOnCommunitySupervisionForLife: null,
          usTnNotServingIneligibleCrOffensePolicyB: null,
          latestDrugTestIsNegativeOrMissing: {
            latestDrugScreenDate: relativeFixtureDate({ days: -33 }),
            latestDrugScreenResult: "DRUM",
          },
          onMinimumOrLowMediumSupervisionAtLeastSixMonths: {
            eligibleDate: relativeFixtureDate({ months: -1, days: -5 }),
          },
          usTnAssessedNotHighOnStrongRDomains: {
            assessmentDate: relativeFixtureDate({ days: -121 }),
            assessmentMetadata: {
              AGGRESSION_NEED_LEVEL: "LOW",
              ALCOHOL_DRUG_NEED_LEVEL: "MOD",
            },
          },
          usTnFeeScheduleOrPermanentExemption: {
            contactType: null,
            currentExemptions: "SSDB",
            latestFeeContactDate: null,
          },
        },
        ineligibleCriteria: {},
        metadata: {
          tabName: "MISSING_)_CRITERIA",
          allOffenses: ["FIRST DEGERE MURDER", "MURDER"],
          mostRecentArrestCheck: {
            contactDate: relativeFixtureDate({ days: -70 }),
            contactType: "ARRN",
          },
          mostRecentSpeNote: {
            contactDate: relativeFixtureDate({ days: -50 }),
            contactType: "SPEC",
          },
          convictionCounties: ["123 - ABC", "456 - DEF"],
          ineligibleOffensesExpired: [],
        },
        isEligible: true,
        isAlmostEligible: false,
      },
      {
        stateCode: "US_TN",
        externalId: "104",
        eligibleCriteria: {
          usTnNoArrestsInPast6Months: null,
          usTnNoSupervisionSanctionWithin3Months: null,
          noSupervisionViolationReportWithin6Months: null,
          usTnNoSupervisionViolationsReportWithin6Months: null,
          usTnNotInDayReportingCenterLocation: null,
          usTnNotOnCommunitySupervisionForLife: null,
          usTnNotServingIneligibleCrOffensePolicyB: null,
          latestDrugTestIsNegativeOrMissing: {
            latestDrugScreenDate: relativeFixtureDate({ days: -111 }),
            latestDrugScreenResult: "DRUN",
          },
          onMinimumOrLowMediumSupervisionAtLeastSixMonths: {
            eligibleDate: relativeFixtureDate({ months: -1, days: -5 }),
          },
          usTnAssessedNotHighOnStrongRDomains: {
            assessmentDate: relativeFixtureDate({ days: -33 }),
            assessmentMetadata: {
              AGGRESSION_NEED_LEVEL: "LOW",
              ALCOHOL_DRUG_NEED_LEVEL: "MOD",
            },
          },
          usTnFeeScheduleOrPermanentExemption: {
            contactType: null,
            currentExemptions: "SSDB",
            latestFeeContactDate: null,
          },
        },
        ineligibleCriteria: {
          usTnNoRecentCompliantReportingRejections: {
            contactCode: ["DECF", "DEDU"],
          },
        },
        metadata: {
          tabName: "MISSING_1_CRITERIA",
          mostRecentArrestCheck: {
            contactDate: relativeFixtureDate({ months: -1 }),
            contactType: "ARRN",
          },
          mostRecentSpeNote: {
            contactDate: relativeFixtureDate({ months: -1 }),
            contactType: "SPEC",
          },
          ineligibleOffensesExpired: ["TNCARE FRAUD"],
          convictionCounties: [],
        },
        isEligible: false,
        isAlmostEligible: true,
      },
      {
        stateCode: "US_TN",
        externalId: "201",
        eligibleCriteria: {
          usTnNoArrestsInPast6Months: null,
          usTnNoSupervisionSanctionWithin3Months: null,
          noSupervisionViolationReportWithin6Months: null,
          usTnNoSupervisionViolationsReportWithin6Months: null,
          usTnNotInDayReportingCenterLocation: null,
          usTnNotOnCommunitySupervisionForLife: null,
          usTnNotServingIneligibleCrOffensePolicyB: null,
          latestDrugTestIsNegativeOrMissing: {
            latestDrugScreenDate: relativeFixtureDate({ days: -200 }),
            latestDrugScreenResult: "DRUN",
          },
          onMinimumOrLowMediumSupervisionAtLeastSixMonths: {
            eligibleDate: relativeFixtureDate({ months: -1, days: -5 }),
          },
          usTnAssessedNotHighOnStrongRDomains: {
            assessmentDate: relativeFixtureDate({ days: -33 }),
            assessmentMetadata: {
              AGGRESSION_NEED_LEVEL: "LOW",
              ALCOHOL_DRUG_NEED_LEVEL: "MOD",
            },
          },
          usTnFeeScheduleOrPermanentExemption: {
            contactType: null,
            currentExemptions: "SSDB",
            latestFeeContactDate: null,
          },
        },
        ineligibleCriteria: {},
        metadata: {
          convictionCounties: ["123 - ABC", "456 - DEF"],
          ineligibleOffensesExpired: [],
          mostRecentArrestCheck: {
            contactDate: relativeFixtureDate({ days: -72 }),
            contactType: "ARRN",
          },
          mostRecentSpeNote: {
            contactDate: relativeFixtureDate({ days: -99 }),
            contactType: "SPEC",
          },
        },
        isEligible: true,
        isAlmostEligible: false,
      },
      {
        stateCode: "US_TN",
        externalId: "202",
        eligibleCriteria: {
          usTnNoArrestsInPast6Months: null,
          usTnNoSupervisionSanctionWithin3Months: null,
          noSupervisionViolationReportWithin6Months: null,
          usTnNoSupervisionViolationsReportWithin6Months: null,
          usTnNotInDayReportingCenterLocation: null,
          usTnNotOnCommunitySupervisionForLife: null,
          usTnNotServingIneligibleCrOffensePolicyB: null,
          latestDrugTestIsNegativeOrMissing: {
            latestDrugScreenDate: relativeFixtureDate({ days: -200 }),
            latestDrugScreenResult: "DRUN",
          },
          onMinimumOrLowMediumSupervisionAtLeastSixMonths: {
            eligibleDate: relativeFixtureDate({ months: -1, days: -5 }),
          },
          usTnAssessedNotHighOnStrongRDomains: {
            assessmentDate: relativeFixtureDate({ days: -33 }),
            assessmentMetadata: {
              AGGRESSION_NEED_LEVEL: "LOW",
              ALCOHOL_DRUG_NEED_LEVEL: "MOD",
            },
          },
        },
        ineligibleCriteria: {
          usTnFeeScheduleOrPermanentExemption: {
            contactType: "FEER",
            currentExemptions: null,
            latestFeeContactDate: relativeFixtureDate({ months: -1, days: -5 }),
          },
        },
        metadata: {
          tabName: "MISSING_1_CRITERIA",
          convictionCounties: ["123ABC"],
          ineligibleOffensesExpired: [],
          mostRecentArrestCheck: {
            contactDate: relativeFixtureDate({ days: -5 }),
            contactType: "ARRN",
          },
        },
        isEligible: false,
        isAlmostEligible: true,
      },

      {
        stateCode: "US_TN",
        externalId: "107",
        eligibleCriteria: {
          usTnNoArrestsInPast6Months: null,
          usTnNoSupervisionSanctionWithin3Months: null,
          noSupervisionViolationReportWithin6Months: null,
          usTnNoSupervisionViolationsReportWithin6Months: null,
          usTnNotInDayReportingCenterLocation: null,
          usTnNotOnCommunitySupervisionForLife: null,
          usTnNotServingIneligibleCrOffensePolicyB: null,
          latestDrugTestIsNegativeOrMissing: {
            latestDrugScreenDate: relativeFixtureDate({ days: -200 }),
            latestDrugScreenResult: "DRUN",
          },
          onMinimumOrLowMediumSupervisionAtLeastSixMonths: {
            eligibleDate: relativeFixtureDate({ months: -1, days: -5 }),
          },
        },
        ineligibleCriteria: {
          usTnAssessedNotHighOnStrongRDomains: {
            assessmentDate: relativeFixtureDate({ days: -33 }),
            assessmentMetadata: {
              AGGRESSION_NEED_LEVEL: "LOW",
              ALCOHOL_DRUG_NEED_LEVEL: "HIGH",
            },
          },
          usTnFeeScheduleOrPermanentExemption: {
            contactType: "FEER",
            currentExemptions: null,
            latestFeeContactDate: relativeFixtureDate({ days: -25 }),
          },
        },
        metadata: {
          tabName: "MISSING_2_CRITERIA",
          convictionCounties: ["123 - ABC", "456 - DEF"],
          ineligibleOffensesExpired: ["HABITUAL TRAFFIC OFFENDER"],
          mostRecentArrestCheck: {
            contactDate: relativeFixtureDate({ months: -1 }),
            contactType: "ARRN",
          },
          mostRecentSpeNote: {
            contactDate: relativeFixtureDate({ days: -222 }),
            contactType: "SPET",
          },
        },
        isEligible: false,
        isAlmostEligible: true,
      },
      {
        stateCode: "US_TN",
        externalId: "203",
        eligibleCriteria: {
          usTnNoArrestsInPast6Months: null,
          usTnNoSupervisionSanctionWithin3Months: null,
          noSupervisionViolationReportWithin6Months: null,
          usTnNoSupervisionViolationsReportWithin6Months: null,
          usTnNotInDayReportingCenterLocation: null,
          usTnNotOnCommunitySupervisionForLife: null,
          usTnNotServingIneligibleCrOffensePolicyB: null,
          latestDrugTestIsNegativeOrMissing: {
            latestDrugScreenDate: relativeFixtureDate({ days: -200 }),
            latestDrugScreenResult: "DRUN",
          },
        },
        ineligibleCriteria: {
          usTnAssessedNotHighOnStrongRDomains: {
            assessmentDate: relativeFixtureDate({ days: -33 }),
            assessmentMetadata: {
              AGGRESSION_NEED_LEVEL: "LOW",
              ALCOHOL_DRUG_NEED_LEVEL: "HIGH",
            },
          },
          usTnFeeScheduleOrPermanentExemption: {
            contactType: "FEER",
            currentExemptions: null,
            latestFeeContactDate: relativeFixtureDate({ days: -25 }),
          },
          onMinimumOrLowMediumSupervisionAtLeastSixMonths: {
            eligibleDate: relativeFixtureDate({ months: -1 }),
          },
        },
        metadata: {
          tabName: "MISSING_3_CRITERIA",
          convictionCounties: ["123 - ABC", "456 - DEF"],
          ineligibleOffensesExpired: ["HABITUAL TRAFFIC OFFENDER"],
          mostRecentArrestCheck: {
            contactDate: relativeFixtureDate({ months: -1 }),
            contactType: "ARRN",
          },
          mostRecentSpeNote: {
            contactDate: relativeFixtureDate({ days: -222 }),
            contactType: "SPET",
          },
        },
        isEligible: false,
        isAlmostEligible: true,
      },
    ],
  );

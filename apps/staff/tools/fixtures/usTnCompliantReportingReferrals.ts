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

import { CompliantReportingReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsTn";
import { fixtureWithIdKey } from "./utils";

export const usTnCompliantReportingReferrals =
  fixtureWithIdKey<CompliantReportingReferralRecordRaw>("externalId", [
    {
      stateCode: "US_TN",
      externalId: "100",
      eligibleCriteria: {
        usTnNoArrestsInPastYear: null,
        usTnSpecialConditionsAreCurrent: {
          speNoteDue: null,
        },
        usTnNotServingIneligibleCrOffense: null,
        usTnPassedDrugScreenCheck: {
          hasAtLeast1NegativeDrugTestPastYear: [
            {
              negativeScreenDate: "2022-01-26",
              negativeScreenResult: "DRUN",
            },
          ],
          latestDrugTestIsNegative: {
            latestDrugScreenDate: "2022-01-26",
            latestDrugScreenResult: "DRUN",
          },
        },
        usTnNoZeroToleranceCodesSpans: { zeroToleranceCodeDates: null },
        usTnIneligibleOffensesExpired: {
          ineligibleOffenses: ["HABITUAL TRAFFIC OFFENDER"],
          ineligibleSentencesExpirationDates: ["2020-05-06"],
        },
        usTnNotServingUnknownCrOffense: null,
        hasActiveSentence: { hasActiveSentence: true },
        usTnOnEligibleLevelForSufficientTime: {
          eligibleDate: "2020-10-26",
          eligibleLevel: "MEDIUM",
          startDateOnEligibleLevel: "2019-10-26",
        },
        usTnFinesFeesEligible: {
          hasFinesFeesBalanceBelow500: {
            amountOwed: 0,
          },
          hasPayments3ConsecutiveMonths: {
            amountOwed: 0,
            consecutiveMonthlyPayments: 3,
          },
        },
        usTnNoHighSanctionsInPastYear: null,
        usTnNoRecentCompliantReportingRejections: null,
        usTnNoPriorRecordWithIneligibleCrOffense: null,
      },
      ineligibleCriteria: {},
      formInformation: {
        sentenceStartDate: "2019-10-26",
        currentOffenses: ["FAILURE TO APPEAR (FELONY)"],
        driversLicense: "12345678",
        restitutionAmt: 400.0,
        restitutionMonthlyPayment: 0.0,
        restitutionMonthlyPaymentTo: ["2ND JUDICIAL DRUG TASK FORCE"],
        judicialDistrict: ["17"],
      },
      metadata: {
        convictionCounties: ["123 - ABC", "456 - DEF"],
        ineligibleOffensesExpired: ["HABITUAL TRAFFIC OFFENDER"],
        mostRecentArrestCheck: {
          contactDate: "2022-01-03",
          contactType: "ARRN",
        },
        mostRecentSpeNote: {
          contactDate: "2021-12-31",
          contactType: "SPET",
        },
      },
    },
    {
      stateCode: "US_TN",
      externalId: "101",
      eligibleCriteria: {
        usTnNoArrestsInPastYear: null,
        usTnSpecialConditionsAreCurrent: {
          speNoteDue: "2022-12-31",
        },
        usTnNotServingIneligibleCrOffense: null,
        usTnPassedDrugScreenCheck: {
          hasAtLeast1NegativeDrugTestPastYear: [
            { negativeScreenResult: "DRUN", negativeScreenDate: "2021-09-17" },
            { negativeScreenResult: "DRUM", negativeScreenDate: "2022-02-02" },
          ],
          latestDrugTestIsNegative: {
            latestDrugScreenDate: "2022-02-02",
            latestDrugScreenResult: "DRUM",
          },
        },
        usTnNoZeroToleranceCodesSpans: {
          zeroToleranceCodeDates: [
            "2018-04-20",
            "2017-08-30",
            "2016-06-27",
            "2018-01-30",
            "2019-07-29",
          ],
        },
        usTnIneligibleOffensesExpired: null,
        usTnNotServingUnknownCrOffense: null,
        hasActiveSentence: { hasActiveSentence: false },
        usTnOnEligibleLevelForSufficientTime: {
          eligibleDate: "2020-12-20",
          eligibleLevel: "MEDIUM",
          startDateOnEligibleLevel: "2019-12-20",
        },
        usTnFinesFeesEligible: {
          hasFinesFeesBalanceBelow500: {
            amountOwed: 600,
          },
          hasPayments3ConsecutiveMonths: {
            amountOwed: 0,
            consecutiveMonthlyPayments: 0,
          },
        },
        usTnNoHighSanctionsInPastYear: null,
        usTnNoRecentCompliantReportingRejections: null,
      },
      ineligibleCriteria: {},
      formInformation: {
        sentenceStartDate: "2022-01-17",
        expirationDate: "2024-01-17",
        sentenceLengthDays: "730",
        currentOffenses: [
          "FAILURE TO APPEAR (FELONY)",
          "FAILURE TO APPEAR (FELONY)",
        ],
        driversLicense: "12345678",
        restitutionAmt: 0.0,
        restitutionMonthlyPayment: 0.0,
        judicialDistrict: ["14"],
      },
      metadata: {
        mostRecentArrestCheck: {
          contactDate: "2022-01-03",
          contactType: "ARRN",
        },
        mostRecentSpeNote: {
          contactDate: "2021-12-31",
          contactType: "SPEC",
        },
        convictionCounties: ["123 - ABC", "456 - DEF"],
        ineligibleOffensesExpired: [],
      },
    },
    {
      stateCode: "US_TN",
      externalId: "102",
      eligibleCriteria: {
        usTnNoArrestsInPastYear: null,
        usTnSpecialConditionsAreCurrent: {
          speNoteDue: null,
        },
        usTnNotServingIneligibleCrOffense: null,
        usTnPassedDrugScreenCheck: {
          hasAtLeast1NegativeDrugTestPastYear: [
            { negativeScreenResult: "DRUN", negativeScreenDate: "2021-11-26" },
          ],

          latestDrugTestIsNegative: {
            latestDrugScreenResult: "DRUN",
            latestDrugScreenDate: "2021-11-26",
          },
        },
        usTnNoZeroToleranceCodesSpans: {
          zeroToleranceCodeDates: null,
        },
        usTnIneligibleOffensesExpired: null,
        usTnNotServingUnknownCrOffense: null,
        hasActiveSentence: { hasActiveSentence: true },
        usTnNoHighSanctionsInPastYear: null,
        usTnNoRecentCompliantReportingRejections: null,
      },
      ineligibleCriteria: {},
      formInformation: {
        sentenceStartDate: "2020-01-17",
        expirationDate: "2023-01-17",
        sentenceLengthDays: "1096",
        currentOffenses: [
          "BURGLARY-OTHER THAN HABITATION",
          "THEFT OF PROPERTY - $1,000-$10,000",
        ],
        driversLicense: "12345667",
        restitutionAmt: 136.0,
        restitutionMonthlyPayment: 0.0,
        restitutionMonthlyPaymentTo: ["FAKE PERSON"],
      },
      metadata: {
        convictionCounties: ["123 - ABC", "456 - DEF"],
        ineligibleOffensesExpired: [],
        mostRecentArrestCheck: {
          contactDate: "2023-08-09",
          contactType: "ARRN",
        },
      },
    },
    {
      stateCode: "US_TN",
      externalId: "104",
      eligibleCriteria: {
        usTnNoArrestsInPastYear: null,
        usTnSpecialConditionsAreCurrent: {
          speNoteDue: "2022-12-31",
        },
        usTnNotServingIneligibleCrOffense: null,
        usTnPassedDrugScreenCheck: {
          hasAtLeast1NegativeDrugTestPastYear: [
            { negativeScreenResult: "DRUX", negativeScreenDate: "2021-11-26" },
          ],
          latestDrugTestIsNegative: {
            latestDrugScreenResult: "DRUX",
            latestDrugScreenDate: "2021-11-26",
          },
        },
        usTnNoZeroToleranceCodesSpans: {
          zeroToleranceCodeDates: null,
        },
        usTnIneligibleOffensesExpired: {
          ineligibleOffenses: ["TNCARE FRAUD"],
          ineligibleSentencesExpirationDates: ["2023-03-02"],
        },
        usTnNotServingUnknownCrOffense: null,
        hasActiveSentence: { hasActiveSentence: true },
        usTnOnEligibleLevelForSufficientTime: {
          eligibleDate: "2020-10-07",
          eligibleLevel: "MINIMUM",
          startDateOnEligibleLevel: "2020-04-07",
        },
        usTnFinesFeesEligible: {
          hasFinesFeesBalanceBelow500: {
            amountOwed: 600,
          },
          hasPayments3ConsecutiveMonths: {
            amountOwed: 0,
            consecutiveMonthlyPayments: 0,
          },
        },
        usTnNoHighSanctionsInPastYear: null,
      },
      ineligibleCriteria: {
        usTnNoRecentCompliantReportingRejections: {
          contactCode: ["DECF", "DEDU"],
        },
      },
      formInformation: {
        sentenceStartDate: "2022-08-26",
        expirationDate: "2025-08-26",
        sentenceLengthDays: "1095",
        currentOffenses: ["THEFT OF PROPERTY - $10,000-$60,000"],
        supervisionFeeArrearaged: false,
        judicialDistrict: [],
      },
      metadata: {
        mostRecentArrestCheck: {
          contactDate: "2022-01-03",
          contactType: "ARRN",
        },
        mostRecentSpeNote: {
          contactDate: "2021-12-31",
          contactType: "SPEC",
        },
        ineligibleOffensesExpired: ["TNCARE FRAUD"],
        convictionCounties: [],
      },
    },
    {
      stateCode: "US_TN",
      externalId: "201",
      eligibleCriteria: {
        usTnOnEligibleLevelForSufficientTime: {
          eligibleDate: "2023-11-11",
          eligibleLevel: "MEDIUM",
          startDateOnEligibleLevel: "2021-11-11",
        },
        usTnFinesFeesEligible: {
          hasFinesFeesBalanceBelow500: { amountOwed: 45 },
          hasPayments3ConsecutiveMonths: {
            amountOwed: 45,
            consecutiveMonthlyPayments: 3,
          },
          hasPermanentFinesFeesExemption: {
            currentExemptions: ["SSDB", "SSDB"],
          },
        },
        usTnNoArrestsInPastYear: null,
        usTnNoHighSanctionsInPastYear: null,
        usTnNoRecentCompliantReportingRejections: null,
        usTnSpecialConditionsAreCurrent: {
          speNoteDue: "2023-10-01",
        },
        usTnNotServingIneligibleCrOffense: null,
        usTnPassedDrugScreenCheck: {
          hasAtLeast1NegativeDrugTestPastYear: [
            {
              negativeScreenDate: "2023-10-28",
              negativeScreenResult: "DRUN",
            },
            {
              negativeScreenDate: "2023-09-28",
              negativeScreenResult: "DRUN",
            },
          ],
          latestDrugTestIsNegative: {
            latestDrugScreenDate: "2023-10-28",
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
        sentenceStartDate: "2013-10-09",
        currentOffenses: ["BURGLARY"],
        driversLicense: "12345",
        courtCostsPaid: false,
        supervisionFeeAssessed: 0,
        supervisionFeeArrearaged: false,
        supervisionFeeArrearagedAmount: 0,
        currentExemptionsAndExpiration: [
          {
            exemptionReason: "SSDB",
            endDate: null,
          },
          {
            exemptionReason: "SSDB",
            endDate: null,
          },
        ],
        supervisionFeeWaived: true,
      },
      metadata: {
        convictionCounties: ["123 - ABC", "456 - DEF"],
        ineligibleOffensesExpired: [],
        mostRecentArrestCheck: {
          contactDate: "2023-03-01",
          contactType: "ARRN",
        },
        mostRecentSpeNote: {
          contactDate: "2023-03-01",
          contactType: "SPEC",
        },
      },
    },
    {
      stateCode: "US_TN",
      externalId: "202",
      eligibleCriteria: {
        usTnOnEligibleLevelForSufficientTime: {
          eligibleDate: "2022-11-04",
          eligibleLevel: "MINIMUM",
          startDateOnEligibleLevel: "2021-05-04",
        },
        usTnNoArrestsInPastYear: null,
        usTnNoHighSanctionsInPastYear: null,
        usTnSpecialConditionsAreCurrent: {
          speNoteDue: null,
        },
        usTnNotServingIneligibleCrOffense: null,
        usTnPassedDrugScreenCheck: {
          hasAtLeast1NegativeDrugTestPastYear: [
            {
              negativeScreenDate: "2023-03-09",
              negativeScreenResult: "DRUN",
            },
          ],
          latestDrugTestIsNegative: {
            latestDrugScreenDate: "2023-03-09",
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
        usTnNoRecentCompliantReportingRejections: null,
      },
      ineligibleCriteria: {
        usTnFinesFeesEligible: {
          hasFinesFeesBalanceBelow500: { amountOwed: 700 },
          hasPayments3ConsecutiveMonths: {
            amountOwed: 700,
            consecutiveMonthlyPayments: null,
          },
        },
      },
      formInformation: {
        sentenceStartDate: "2020-03-07",
        currentOffenses: ["EVADING ARREST"],
        courtCostsPaid: false,
        supervisionFeeArrearaged: false,
      },
      metadata: {
        convictionCounties: ["123ABC"],
        ineligibleOffensesExpired: [],
        mostRecentArrestCheck: {
          contactDate: "2023-04-01",
          contactType: "ARRN",
        },
        mostRecentSpeNote: {
          contactDate: "2019-08-15",
          contactType: "SPET",
        },
      },
    },
  ]);

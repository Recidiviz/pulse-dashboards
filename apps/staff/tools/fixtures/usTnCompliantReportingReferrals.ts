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
              negativeScreenDate: relativeFixtureDate({ days: -200 }),
              negativeScreenResult: "DRUN",
            },
          ],
          latestDrugTestIsNegative: {
            latestDrugScreenDate: relativeFixtureDate({ days: -200 }),
            latestDrugScreenResult: "DRUN",
          },
        },
        usTnNoZeroToleranceCodesSpans: { zeroToleranceCodeDates: null },
        usTnIneligibleOffensesExpired: {
          ineligibleOffenses: ["HABITUAL TRAFFIC OFFENDER"],
          ineligibleSentencesExpirationDates: [
            relativeFixtureDate({ years: -3 }),
          ],
        },
        usTnNotServingUnknownCrOffense: null,
        hasActiveSentence: { hasActiveSentence: true },
        usTnOnEligibleLevelForSufficientTime: {
          eligibleDate: relativeFixtureDate({
            years: -2,
            days: -111,
            months: 18,
          }),
          eligibleLevel: "MEDIUM",
          startDateOnEligibleLevel: relativeFixtureDate({
            years: -2,
            days: -111,
          }),
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
        sentenceStartDate: relativeFixtureDate({ years: -2, days: -555 }),
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
        latestNegativeArrestCheck: {
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
        usTnNoArrestsInPastYear: null,
        usTnSpecialConditionsAreCurrent: {
          speNoteDue: relativeFixtureDate({ days: -50 }),
        },
        usTnNotServingIneligibleCrOffense: null,
        usTnPassedDrugScreenCheck: {
          hasAtLeast1NegativeDrugTestPastYear: [
            {
              negativeScreenResult: "DRUN",
              negativeScreenDate: relativeFixtureDate({ days: -111 }),
            },
            {
              negativeScreenResult: "DRUM",
              negativeScreenDate: relativeFixtureDate({ days: -33 }),
            },
          ],
          latestDrugTestIsNegative: {
            latestDrugScreenDate: relativeFixtureDate({ days: -33 }),
            latestDrugScreenResult: "DRUM",
          },
        },
        usTnNoZeroToleranceCodesSpans: {
          zeroToleranceCodeDates: [
            relativeFixtureDate({ days: -121 }),
            relativeFixtureDate({ months: -1, days: -144 }),
            relativeFixtureDate({ months: -2, days: -169 }),
          ],
        },
        usTnIneligibleOffensesExpired: null,
        usTnNotServingUnknownCrOffense: null,
        hasActiveSentence: { hasActiveSentence: false },
        usTnOnEligibleLevelForSufficientTime: {
          eligibleDate: relativeFixtureDate({ months: -1, days: -5 }),
          eligibleLevel: "MEDIUM",
          startDateOnEligibleLevel: relativeFixtureDate({
            months: -19,
            days: -5,
          }),
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
        sentenceStartDate: relativeFixtureDate({ months: -19, days: -5 }),
        expirationDate: relativeFixtureDate({ days: -11 }),
        sentenceLengthDays: "570",
        currentOffenses: ["FAILURE TO APPEAR (FELONY)", "THEFT OF PROPERTY"],
        driversLicense: "12345678",
        restitutionAmt: 0.0,
        restitutionMonthlyPayment: 0.0,
        judicialDistrict: ["14"],
      },
      metadata: {
        latestNegativeArrestCheck: {
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
        usTnNoArrestsInPastYear: null,
        usTnSpecialConditionsAreCurrent: {
          speNoteDue: relativeFixtureDate({ days: -50 }),
        },
        usTnNotServingIneligibleCrOffense: null,
        usTnPassedDrugScreenCheck: {
          hasAtLeast1NegativeDrugTestPastYear: [
            {
              negativeScreenResult: "DRUN",
              negativeScreenDate: relativeFixtureDate({ days: -111 }),
            },
            {
              negativeScreenResult: "DRUM",
              negativeScreenDate: relativeFixtureDate({ days: -33 }),
            },
          ],
          latestDrugTestIsNegative: {
            latestDrugScreenDate: relativeFixtureDate({ days: -33 }),
            latestDrugScreenResult: "DRUM",
          },
        },
        usTnNoZeroToleranceCodesSpans: {
          zeroToleranceCodeDates: null,
        },
        usTnIneligibleOffensesExpired: null,
        usTnNotServingUnknownCrOffense: null,
        hasActiveSentence: { hasActiveSentence: false },
        usTnOnEligibleLevelForSufficientTime: {
          eligibleDate: relativeFixtureDate({ months: -1, days: -5 }),
          eligibleLevel: "MEDIUM",
          startDateOnEligibleLevel: relativeFixtureDate({
            months: -19,
            days: -5,
          }),
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
      ineligibleCriteria: {
        usTnNoRecentCompliantReportingRejections: {
          contactCode: ["DECF", "DEDU"],
        },
      },
      formInformation: {
        sentenceStartDate: relativeFixtureDate({ months: -20 }),
        expirationDate: relativeFixtureDate({ days: 1000 }),
        sentenceLengthDays: "1700",
        currentOffenses: ["THEFT OF PROPERTY - $10,000-$60,000"],
        supervisionFeeArrearaged: false,
        judicialDistrict: [],
      },
      metadata: {
        latestNegativeArrestCheck: {
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
        usTnOnEligibleLevelForSufficientTime: {
          eligibleDate: relativeFixtureDate({ months: -1, days: 2 }),
          eligibleLevel: "MINIMUM",
          startDateOnEligibleLevel: relativeFixtureDate({
            months: -13,
            days: 2,
          }),
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
          speNoteDue: relativeFixtureDate({ days: -99 }),
        },
        usTnNotServingIneligibleCrOffense: null,
        usTnPassedDrugScreenCheck: {
          hasAtLeast1NegativeDrugTestPastYear: [
            {
              negativeScreenDate: relativeFixtureDate({ days: -200 }),
              negativeScreenResult: "DRUN",
            },
          ],
          latestDrugTestIsNegative: {
            latestDrugScreenDate: relativeFixtureDate({ days: -200 }),
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
        sentenceStartDate: relativeFixtureDate({ months: -13, days: 2 }),
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
        latestNegativeArrestCheck: {
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
        usTnOnEligibleLevelForSufficientTime: {
          eligibleDate: relativeFixtureDate({ months: -1, days: 2 }),
          eligibleLevel: "MINIMUM",
          startDateOnEligibleLevel: relativeFixtureDate({
            months: -13,
            days: 2,
          }),
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
              negativeScreenDate: relativeFixtureDate({ days: -200 }),
              negativeScreenResult: "DRUN",
            },
          ],
          latestDrugTestIsNegative: {
            latestDrugScreenDate: relativeFixtureDate({ days: -200 }),
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
        sentenceStartDate: relativeFixtureDate({ months: -13, days: 2 }),
        currentOffenses: ["EVADING ARREST"],
        courtCostsPaid: false,
        supervisionFeeArrearaged: false,
      },
      metadata: {
        convictionCounties: ["123ABC"],
        ineligibleOffensesExpired: [],
        latestNegativeArrestCheck: {
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
        usTnNoArrestsInPastYear: null,
        usTnSpecialConditionsAreCurrent: {
          speNoteDue: null,
        },
        usTnNotServingIneligibleCrOffense: null,
        usTnPassedDrugScreenCheck: {
          hasAtLeast1NegativeDrugTestPastYear: [
            {
              negativeScreenDate: relativeFixtureDate({ months: -6, days: 6 }),
              negativeScreenResult: "DRUN",
            },
          ],
          latestDrugTestIsNegative: {
            latestDrugScreenDate: relativeFixtureDate({ months: -6, days: 6 }),
            latestDrugScreenResult: "DRUN",
          },
        },
        usTnNoZeroToleranceCodesSpans: { zeroToleranceCodeDates: null },
        usTnIneligibleOffensesExpired: {
          ineligibleOffenses: ["HABITUAL TRAFFIC OFFENDER"],
          ineligibleSentencesExpirationDates: [
            relativeFixtureDate({ months: -7 }),
          ],
        },
        usTnNotServingUnknownCrOffense: null,
        hasActiveSentence: { hasActiveSentence: true },
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
      ineligibleCriteria: {
        usTnOnEligibleLevelForSufficientTime: {
          eligibleDate: relativeFixtureDate({ days: 4 }),
          eligibleLevel: "MINIMUM",
          startDateOnEligibleLevel: relativeFixtureDate({ years: -1, days: 4 }),
        },
      },
      formInformation: {
        sentenceStartDate: relativeFixtureDate({ years: -2, days: 22 }),
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
        latestNegativeArrestCheck: {
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
        usTnNoArrestsInPastYear: null,
        usTnSpecialConditionsAreCurrent: {
          speNoteDue: null,
        },
        usTnNotServingIneligibleCrOffense: null,
        usTnPassedDrugScreenCheck: {
          hasAtLeast1NegativeDrugTestPastYear: [
            {
              negativeScreenDate: relativeFixtureDate({ days: -77 }),
              negativeScreenResult: "DRUN",
            },
          ],
          latestDrugTestIsNegative: {
            latestDrugScreenDate: relativeFixtureDate({ days: -77 }),
            latestDrugScreenResult: "DRUN",
          },
        },
        usTnNoZeroToleranceCodesSpans: { zeroToleranceCodeDates: null },
        usTnIneligibleOffensesExpired: {
          ineligibleOffenses: ["HABITUAL TRAFFIC OFFENDER"],
          ineligibleSentencesExpirationDates: [
            relativeFixtureDate({ months: -7 }),
          ],
        },
        usTnNotServingUnknownCrOffense: null,
        hasActiveSentence: { hasActiveSentence: true },
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
      ineligibleCriteria: {
        usTnOnEligibleLevelForSufficientTime: {
          eligibleDate: relativeFixtureDate({ days: 9 }),
          eligibleLevel: "MEDIUM",
          startDateOnEligibleLevel: relativeFixtureDate({
            months: -18,
            days: 9,
          }),
        },
      },
      formInformation: {
        sentenceStartDate: relativeFixtureDate({ months: -23 }),
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
        latestNegativeArrestCheck: {
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
  ]);

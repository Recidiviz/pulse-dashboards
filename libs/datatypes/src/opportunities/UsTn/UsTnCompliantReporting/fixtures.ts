// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { makeRecordFixture } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import { CompliantReportingRecord, compliantReportingSchema } from "./schema";

export const compliantReportingFixtures = {
  eligible: makeRecordFixture(compliantReportingSchema, {
    stateCode: "US_TN",
    externalId: "101",
    eligibleCriteria: {
      hasActiveSentence: { hasActiveSentence: true },
      usTnNoArrestsInPastYear: null,
      usTnNoHighSanctionsInPastYear: null,
      usTnNoRecentCompliantReportingRejections: null,
      usTnNotServingIneligibleCrOffense: null,
      usTnNoZeroToleranceCodesSpans: null,
      usTnIneligibleOffensesExpired: null,
      usTnNoPriorRecordWithIneligibleCrOffense: null,
      usTnNotServingUnknownCrOffense: null,
      usTnOnEligibleLevelForSufficientTime: {
        eligibleDate: "2020-08-01",
        eligibleLevel: "MINIMUM",
        startDateOnEligibleLevel: "2019-08-01",
      },
      usTnPassedDrugScreenCheck: {
        negativeDrugScreenHistoryArray: [
          { negativeScreenDate: "2023-02-28", negativeScreenResult: "DRUN" },
        ],
        latestDrugScreenDate: "2023-02-28",
        latestDrugScreenResult: "DRUN",
      },
      usTnSpecialConditionsAreCurrent: { speNoteDue: null },
    },
    ineligibleCriteria: {},
    formInformation: {
      currentOffenses: ["STOLEN PROPERTY"],
      docketNumbers: ["10000"],
      expirationDate: "2030-02-12",
      judicialDistrict: ["1"],
      restitutionAmt: 100.0,
      restitutionMonthlyPayment: 0.0,
      restitutionMonthlyPaymentTo: ["PAYMENT TO"],
      sentenceLengthDays: "3629",
      sentenceStartDate: "2020-03-07",
      supervisionFeeArrearaged: true,
      supervisionFeeArrearagedAmount: 700.0,
      supervisionFeeAssessed: 700.0,
      supervisionFeeWaived: false,
    },
    metadata: {
      convictionCounties: ["123ABC"],
      ineligibleOffensesExpired: [],
      latestNegativeArrestCheck: {
        contactDate: "2023-04-01",
        contactType: "ARRN",
      },
      mostRecentSpeNote: { contactDate: "2019-08-15", contactType: "SPET" },
    },
    caseNotes: {},
    isEligible: true,
    isAlmostEligible: false,
  }),
  almostEligible: makeRecordFixture(compliantReportingSchema, {
    stateCode: "US_TN",
    externalId: "102",
    eligibleCriteria: {
      hasActiveSentence: { hasActiveSentence: true },
      usTnNoArrestsInPastYear: null,
      usTnNotServingIneligibleCrOffense: null,
      usTnNoZeroToleranceCodesSpans: null,
      usTnIneligibleOffensesExpired: null,
      usTnNoPriorRecordWithIneligibleCrOffense: null,
      usTnNotServingUnknownCrOffense: null,
      usTnPassedDrugScreenCheck: {
        negativeDrugScreenHistoryArray: [
          { negativeScreenDate: "2023-01-04", negativeScreenResult: "DRUN" },
        ],
        latestDrugScreenDate: "2023-01-04",
        latestDrugScreenResult: "DRUN",
      },
      usTnSpecialConditionsAreCurrent: { speNoteDue: null },
    },
    ineligibleCriteria: {
      hasFinesFeesBalanceBelow500OrHasPayments3ConsecutiveMonthsOrIsExempt: {
        amountOwed: 700,
        consecutiveMonthlyPayments: 0,
      },
    },
    formInformation: {
      currentOffenses: ["EXAMPLE OFFENSE"],
      sentenceStartDate: "2019-12-20",
      judicialDistrict: ["A"],
    },
    metadata: {
      latestNegativeArrestCheck: {
        contactDate: "2022-05-28",
        contactType: "ARRN",
      },
      mostRecentSpeNote: { contactDate: "2022-03-15", contactType: "SPEC" },
      convictionCounties: [],
      ineligibleOffensesExpired: [],
    },
    caseNotes: {},
    isEligible: false,
    isAlmostEligible: true,
  }),
} satisfies FixtureMapping<CompliantReportingRecord>;

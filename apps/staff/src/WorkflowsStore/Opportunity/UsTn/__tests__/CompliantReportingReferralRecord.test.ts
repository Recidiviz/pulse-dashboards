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

import tk from "timekeeper";

import {
  CompliantReportingReferralRecordRaw,
  compliantReportingSchema,
} from "../CompliantReportingOpportunity";

const formInformation: CompliantReportingReferralRecordRaw["formInformation"] =
  {
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
  };

const metadata: CompliantReportingReferralRecordRaw["metadata"] &
  Record<string, unknown> = {
  allOffenses: ["FAILURE TO APPEAR (FELONY)", "EVADING ARREST"],
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
};

// There are a handful of criteria that get passed to the frontend that aren't in our schema because
// we don't have copy for them. Make sure the record still gets parsed.
const eligibleCriteria: CompliantReportingReferralRecordRaw["eligibleCriteria"] &
  Record<string, unknown> = {
  hasActiveSentence: { hasActiveSentence: true },
  supervisionLevelIsNotInternalUnknown: null,
  supervisionLevelIsNotInterstateCompact: null,
  supervisionLevelIsNotUnassigned: null,
  supervisionNotPastFullTermCompletionDateOrUpcoming90Days: {
    eligibleDate: "2029-06-06",
  },
  usTnIneligibleOffensesExpired: null,
  usTnNoArrestsInPastYear: null,
  usTnNoDuiOffenseInPast5Years: null,
  usTnNoHighSanctionsInPastYear: null,
  usTnNoMurderConvictions: null,
  usTnNoPriorRecordWithIneligibleCrOffense: null,
  usTnNoRecentCompliantReportingRejections: null,
  usTnNoZeroToleranceCodesSpans: null,
  usTnNotInJudicialDistrict17WhileOnProbation: null,
  usTnNotOnLifeSentenceOrLifetimeSupervision: {
    lifetimeFlag: false,
  },
  usTnNotPermanentlyRejectedFromCompliantReporting: null,
  usTnNotServingIneligibleCrOffense: null,
  usTnNotServingUnknownCrOffense: null,
  usTnOnEligibleLevelForSufficientTime: {
    eligibleDate: "2020-08-01",
    eligibleLevel: "MINIMUM",
    startDateOnEligibleLevel: "2019-08-01",
  },
  usTnPassedDrugScreenCheck: {
    hasAtLeast1NegativeDrugTestPastYear: [
      {
        negativeScreenDate: "2023-02-28",
        negativeScreenResult: "DRUN",
      },
      {
        negativeScreenDate: "2023-01-28",
        negativeScreenResult: "DRUN",
      },
    ],
    latestDrugTestIsNegative: {
      latestDrugScreenDate: "2023-02-28",
      latestDrugScreenResult: "DRUN",
    },
  },
  usTnSpecialConditionsAreCurrent: { speNoteDue: null },
  usTnFinesFeesEligible: {
    hasFinesFeesBalanceBelow500: { amountOwed: 400 },
    hasPayments3ConsecutiveMonths: {
      amountOwed: 400,
      consecutiveMonthlyPayments: null,
    },
  },
};

const { usTnFinesFeesEligible, ...eligibleCriteriaExceptFinesFees } =
  eligibleCriteria;

beforeEach(() => {
  tk.freeze(new Date("2023-12-01"));
});

afterEach(() => {
  tk.reset();
});

test("parse eligible", () => {
  const rawRecord = {
    stateCode: "US_TN",
    externalId: "101",
    eligibleCriteria,
    ineligibleCriteria: {},
    metadata,
    formInformation,
    caseNotes: {},
  };
  expect(compliantReportingSchema.parse(rawRecord)).toMatchSnapshot();
});

test("parse almost eligible", () => {
  const ineligibleCriteria = {
    usTnFinesFeesEligible: {
      hasFinesFeesBalanceBelow500: { amountOwed: 700 },
      hasPayments3ConsecutiveMonths: {
        amountOwed: 700,
        consecutiveMonthlyPayments: 0,
      },
    },
  };
  const rawRecord = {
    stateCode: "US_TN",
    externalId: "101",
    eligibleCriteria: eligibleCriteriaExceptFinesFees,
    ineligibleCriteria,
    metadata,
    formInformation,
    caseNotes: {},
  };
  expect(compliantReportingSchema.parse(rawRecord)).toMatchSnapshot();
});
